import { loadDatabaseConfig, type DatabaseConfig } from './databaseConfig'

export interface PostgresDeploymentConfig extends DatabaseConfig {
  environment: 'development' | 'test' | 'production'
  migrationOnStartup: boolean
  releaseId: string
  expectedMigrationBaseline: number
  releaseCommitSha?: string
}

function isCommitSha(value: string | undefined): boolean {
  return !!value && /^[0-9a-f]{7,64}$/i.test(value)
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value, (character) => character.charCodeAt(0)).some((code) => code <= 0x1f || code === 0x7f)
}

function normalizeEnvironment(value: string | undefined): 'development' | 'test' | 'production' {
  const environment = value?.normalize('NFC').trim().toLowerCase() || 'development'
  if (environment !== 'development' && environment !== 'test' && environment !== 'production') {
    throw new Error('NODE_ENV must be development, test, or production')
  }
  return environment
}

function normalizeReleaseId(value: string | undefined): string {
  const releaseId = value?.normalize('NFC').trim() || 'local'
  if (hasControlCharacters(releaseId)) {
    throw new Error('RELEASE_ID must not contain control characters')
  }
  return releaseId
}

export function loadPostgresDeploymentConfig(
  env: Record<string, string | undefined> = process.env,
): PostgresDeploymentConfig {
  const database = loadDatabaseConfig(env)
  const environment = normalizeEnvironment(env.NODE_ENV)
  if (environment === 'production' && !database.ssl) {
    throw new Error('DATABASE_SSL=true is required in production')
  }
  const rawMigrationOnStartup = env.DATABASE_MIGRATE_ON_STARTUP?.normalize('NFC').trim().toLowerCase()
  if (rawMigrationOnStartup === '') {
    throw new Error('DATABASE_MIGRATE_ON_STARTUP must not be empty')
  }
  if (rawMigrationOnStartup !== undefined && rawMigrationOnStartup !== 'true' && rawMigrationOnStartup !== 'false') {
    throw new Error('DATABASE_MIGRATE_ON_STARTUP must be true or false')
  }
  const migrationOnStartup = rawMigrationOnStartup !== 'false'
  const rawMigrationApproved = env.DATABASE_MIGRATION_APPROVED?.normalize('NFC').trim().toLowerCase()
  if (rawMigrationApproved === '') {
    throw new Error('DATABASE_MIGRATION_APPROVED must not be empty')
  }
  if (rawMigrationApproved !== undefined && rawMigrationApproved !== 'true' && rawMigrationApproved !== 'false') {
    throw new Error('DATABASE_MIGRATION_APPROVED must be true or false')
  }
  if (environment === 'production' && migrationOnStartup && rawMigrationApproved !== 'true') {
    throw new Error('DATABASE_MIGRATION_APPROVED=true is required for production startup migrations')
  }
  const releaseId = normalizeReleaseId(env.RELEASE_ID)
  if (environment === 'production' && releaseId === 'local') {
    throw new Error('RELEASE_ID is required in production')
  }
  const rawBaseline = env.DATABASE_EXPECTED_MIGRATION_BASELINE?.normalize('NFC').trim()
  const expectedMigrationBaseline = rawBaseline === undefined || rawBaseline === '' ? 1 : Number(rawBaseline)
  if (!Number.isSafeInteger(expectedMigrationBaseline) || expectedMigrationBaseline < 1 || expectedMigrationBaseline > 1_000_000) {
    throw new Error('DATABASE_EXPECTED_MIGRATION_BASELINE must be a positive integer')
  }
  const releaseCommitSha = env.RELEASE_COMMIT_SHA?.normalize('NFC').trim().toLowerCase()
  if (environment === 'production' && !isCommitSha(releaseCommitSha)) {
    throw new Error('RELEASE_COMMIT_SHA must be a valid commit SHA in production')
  }
  return { ...database, environment, migrationOnStartup, releaseId, expectedMigrationBaseline, releaseCommitSha }
}

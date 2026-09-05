import { loadDatabaseConfig, type DatabaseConfig } from './databaseConfig'

export interface PostgresDeploymentConfig extends DatabaseConfig {
  environment: 'development' | 'test' | 'production'
  migrationOnStartup: boolean
  releaseId: string
  expectedMigrationBaseline: number
  releaseCommitSha?: string
  healthMaxLatencyMs?: number
  releaseMaxAgeMs?: number
  readinessMaxAgeMs?: number
  evidenceMaxSkewMs?: number
}

function isCommitSha(value: string | undefined): boolean { return !!value && /^[0-9a-f]{7,64}$/i.test(value) }
function hasControlCharacters(value: string): boolean { return Array.from(value, c => c.charCodeAt(0)).some(code => code <= 0x1f || code === 0x7f) }
function normalizeEnvironment(value: string | undefined): 'development' | 'test' | 'production' {
  const environment = value?.normalize('NFC').trim().toLowerCase() || 'development'
  if (!['development', 'test', 'production'].includes(environment)) throw new Error('NODE_ENV must be development, test, or production')
  return environment as 'development' | 'test' | 'production'
}
function normalizeReleaseId(value: string | undefined): string {
  const releaseId = value?.normalize('NFC').trim() || 'local'
  if (hasControlCharacters(releaseId)) throw new Error('RELEASE_ID must not contain control characters')
  return releaseId
}
function loadPositiveInteger(value: string | undefined, name: string): number | undefined {
  const raw = value?.normalize('NFC').trim()
  if (raw === undefined || raw === '') return undefined
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 300000) throw new Error(name + ' must be a positive integer')
  return parsed
}

export function loadPostgresDeploymentConfig(env: Record<string, string | undefined> = process.env): PostgresDeploymentConfig {
  const database = loadDatabaseConfig(env)
  const environment = normalizeEnvironment(env.NODE_ENV)
  if (environment === 'production' && !database.ssl) throw new Error('DATABASE_SSL=true is required in production')
  const rawMigrationOnStartup = env.DATABASE_MIGRATE_ON_STARTUP?.normalize('NFC').trim().toLowerCase()
  if (rawMigrationOnStartup === '') throw new Error('DATABASE_MIGRATE_ON_STARTUP must not be empty')
  if (rawMigrationOnStartup !== undefined && rawMigrationOnStartup !== 'true' && rawMigrationOnStartup !== 'false') throw new Error('DATABASE_MIGRATE_ON_STARTUP must be true or false')
  const migrationOnStartup = rawMigrationOnStartup !== 'false'
  const rawMigrationApproved = env.DATABASE_MIGRATION_APPROVED?.normalize('NFC').trim().toLowerCase()
  if (rawMigrationApproved === '') throw new Error('DATABASE_MIGRATION_APPROVED must not be empty')
  if (rawMigrationApproved !== undefined && rawMigrationApproved !== 'true' && rawMigrationApproved !== 'false') throw new Error('DATABASE_MIGRATION_APPROVED must be true or false')
  if (environment === 'production' && migrationOnStartup && rawMigrationApproved !== 'true') throw new Error('DATABASE_MIGRATION_APPROVED=true is required for production startup migrations')
  const releaseId = normalizeReleaseId(env.RELEASE_ID)
  if (environment === 'production' && releaseId === 'local') throw new Error('RELEASE_ID is required in production')
  const rawBaseline = env.DATABASE_EXPECTED_MIGRATION_BASELINE?.normalize('NFC').trim()
  const expectedMigrationBaseline = rawBaseline === undefined || rawBaseline === '' ? 1 : Number(rawBaseline)
  if (!Number.isSafeInteger(expectedMigrationBaseline) || expectedMigrationBaseline < 1 || expectedMigrationBaseline > 1000000) throw new Error('DATABASE_EXPECTED_MIGRATION_BASELINE must be a positive integer')
  const releaseCommitSha = env.RELEASE_COMMIT_SHA?.normalize('NFC').trim().toLowerCase()
  if (environment === 'production' && !isCommitSha(releaseCommitSha)) throw new Error('RELEASE_COMMIT_SHA must be a valid commit SHA in production')
  const healthMaxLatencyMs = loadPositiveInteger(env.DATABASE_HEALTH_MAX_LATENCY_MS, 'DATABASE_HEALTH_MAX_LATENCY_MS')
  const releaseMaxAgeMs = loadPositiveInteger(env.DATABASE_RELEASE_MAX_AGE_MS, 'DATABASE_RELEASE_MAX_AGE_MS')
  const readinessMaxAgeMs = loadPositiveInteger(env.DATABASE_READINESS_MAX_AGE_MS, 'DATABASE_READINESS_MAX_AGE_MS')
  const evidenceMaxSkewMs = loadPositiveInteger(env.DATABASE_EVIDENCE_MAX_SKEW_MS, 'DATABASE_EVIDENCE_MAX_SKEW_MS')
  for (const [name, value] of [
    ['DATABASE_HEALTH_MAX_LATENCY_MS', healthMaxLatencyMs],
    ['DATABASE_RELEASE_MAX_AGE_MS', releaseMaxAgeMs],
    ['DATABASE_READINESS_MAX_AGE_MS', readinessMaxAgeMs],
    ['DATABASE_EVIDENCE_MAX_SKEW_MS', evidenceMaxSkewMs],
  ] as const) if (environment === 'production' && value === undefined) throw new Error(name + ' is required in production')
  return { ...database, environment, migrationOnStartup, releaseId, expectedMigrationBaseline, releaseCommitSha, healthMaxLatencyMs, releaseMaxAgeMs, readinessMaxAgeMs, evidenceMaxSkewMs }
}

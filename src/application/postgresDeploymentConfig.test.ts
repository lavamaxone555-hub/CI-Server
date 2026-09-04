import { describe, expect, it } from 'vitest'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

const base = { DATABASE_URL: 'postgres://user:pass@localhost:5432/app' }

describe('PostgreSQL deployment config', () => {
  it('loads development defaults', () => {
    expect(loadPostgresDeploymentConfig(base)).toMatchObject({
      environment: 'development', migrationOnStartup: true, releaseId: 'local', expectedMigrationBaseline: 1,
    })
  })

  it('rejects malformed migration boolean configuration', () => {
    expect(() => loadPostgresDeploymentConfig({ ...base, DATABASE_MIGRATE_ON_STARTUP: 'yes' }))
      .toThrow('DATABASE_MIGRATE_ON_STARTUP')
    expect(() => loadPostgresDeploymentConfig({ ...base, DATABASE_MIGRATION_APPROVED: '1' }))
      .toThrow('DATABASE_MIGRATION_APPROVED')
  })

  it('canonicalizes migration boolean configuration', () => {
    expect(loadPostgresDeploymentConfig({ ...base, DATABASE_MIGRATE_ON_STARTUP: '  FALSE  ' }).migrationOnStartup).toBe(false)
    expect(loadPostgresDeploymentConfig({ ...base, DATABASE_MIGRATION_APPROVED: '  TRUE  ' }).migrationOnStartup).toBe(true)
  })

  it('canonicalizes deployment environment configuration', () => {
    expect(loadPostgresDeploymentConfig({ ...base, NODE_ENV: '  PRODUCTION  ', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true', RELEASE_ID: 'r1', RELEASE_COMMIT_SHA: '84a95cf' }).environment)
      .toBe('production')
  })

  it('requires SSL, release identity, and commit identity in production', () => {
    expect(() => loadPostgresDeploymentConfig({ ...base, NODE_ENV: 'production' })).toThrow('DATABASE_SSL=true')
    expect(() => loadPostgresDeploymentConfig({ ...base, NODE_ENV: 'production', DATABASE_SSL: 'true' })).toThrow('DATABASE_MIGRATION_APPROVED=true')
    expect(() => loadPostgresDeploymentConfig({ ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true' })).toThrow('RELEASE_ID is required')
    expect(() => loadPostgresDeploymentConfig({ ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true', RELEASE_ID: 'r1' })).toThrow('RELEASE_COMMIT_SHA')
  })

  it('canonicalizes production release and commit identities', () => {
    const config = loadPostgresDeploymentConfig({
      ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true',
      RELEASE_ID: '  release-é  ', RELEASE_COMMIT_SHA: '  84A95CF  ',
    })
    expect(config.releaseId).toBe('release-é')
    expect(config.releaseCommitSha).toBe('84a95cf')
  })

  it('rejects unsafe or unbounded migration baselines', () => {
    expect(() => loadPostgresDeploymentConfig({ ...base, DATABASE_EXPECTED_MIGRATION_BASELINE: '1000001' }))
      .toThrow('DATABASE_EXPECTED_MIGRATION_BASELINE')
    expect(() => loadPostgresDeploymentConfig({ ...base, DATABASE_EXPECTED_MIGRATION_BASELINE: String(Number.MAX_SAFE_INTEGER + 1) }))
      .toThrow('DATABASE_EXPECTED_MIGRATION_BASELINE')
  })

  it('accepts a complete production deployment identity', () => {
    expect(loadPostgresDeploymentConfig({
      ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true',
      RELEASE_ID: 'r1', RELEASE_COMMIT_SHA: '84a95cf',
    }).releaseCommitSha).toBe('84a95cf')
  })

  it('rejects malformed production commit identity', () => {
    expect(() => loadPostgresDeploymentConfig({
      ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true',
      RELEASE_ID: 'r1', RELEASE_COMMIT_SHA: 'release-1',
    })).toThrow('RELEASE_COMMIT_SHA')
  })

  it('rejects release identities containing control characters', () => {
    expect(() => loadPostgresDeploymentConfig({ ...base, RELEASE_ID: 'release\n1' }))
      .toThrow('RELEASE_ID must not contain control characters')
    expect(() => loadPostgresDeploymentConfig({ ...base, RELEASE_ID: '\u0000release' }))
      .toThrow('RELEASE_ID must not contain control characters')
  })
})

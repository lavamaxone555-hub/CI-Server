import { describe, expect, it } from 'vitest'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

const base = { DATABASE_URL: 'postgres://user:pass@localhost:5432/app' }

describe('PostgreSQL deployment config', () => {
  it('loads development defaults', () => {
    expect(loadPostgresDeploymentConfig(base)).toMatchObject({
      environment: 'development', migrationOnStartup: true, releaseId: 'local', expectedMigrationBaseline: 1,
    })
  })

  it('requires SSL, release identity, and commit identity in production', () => {
    expect(() => loadPostgresDeploymentConfig({ ...base, NODE_ENV: 'production' })).toThrow('DATABASE_SSL=true')
    expect(() => loadPostgresDeploymentConfig({ ...base, NODE_ENV: 'production', DATABASE_SSL: 'true' })).toThrow('DATABASE_MIGRATION_APPROVED=true')
    expect(() => loadPostgresDeploymentConfig({ ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true' })).toThrow('RELEASE_ID is required')
    expect(() => loadPostgresDeploymentConfig({ ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true', RELEASE_ID: 'r1' })).toThrow('RELEASE_COMMIT_SHA')
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

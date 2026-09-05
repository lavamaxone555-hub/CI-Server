import { describe, expect, it } from 'vitest'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

const base = { DATABASE_URL: 'postgres://user:pass@localhost:5432/app' }
const production = {
  ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true',
  RELEASE_ID: 'r1', RELEASE_COMMIT_SHA: '84a95cf', DATABASE_HEALTH_MAX_LATENCY_MS: '200',
}

describe('PostgreSQL deployment configuration', () => {
  it('loads safe development defaults', () => {
    expect(loadPostgresDeploymentConfig(base)).toMatchObject({ environment: 'development', migrationOnStartup: true, releaseId: 'local', expectedMigrationBaseline: 1 })
  })
  it('requires a production health latency limit', () => {
    const { DATABASE_HEALTH_MAX_LATENCY_MS: _, ...withoutLimit } = production
    expect(() => loadPostgresDeploymentConfig(withoutLimit)).toThrow('DATABASE_HEALTH_MAX_LATENCY_MS is required in production')
  })
  it('loads a complete production deployment identity and health limit', () => {
    expect(loadPostgresDeploymentConfig(production)).toMatchObject({ environment: 'production', healthMaxLatencyMs: 200, releaseCommitSha: '84a95cf' })
  })
  it('rejects invalid health latency limits', () => {
    for (const value of ['0', '-1', 'abc', '300001']) {
      expect(() => loadPostgresDeploymentConfig({ ...base, DATABASE_HEALTH_MAX_LATENCY_MS: value })).toThrow('DATABASE_HEALTH_MAX_LATENCY_MS must be a positive integer')
    }
  })
})

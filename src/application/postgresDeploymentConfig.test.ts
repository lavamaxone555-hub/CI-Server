import { describe, expect, it } from 'vitest'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

const base = { DATABASE_URL: 'postgres://user:pass@localhost:5432/app' }
const production = {
  ...base, NODE_ENV: 'production', DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true',
  RELEASE_ID: 'r1', RELEASE_COMMIT_SHA: '84a95cf', DATABASE_HEALTH_MAX_LATENCY_MS: '200',
  DATABASE_RELEASE_MAX_AGE_MS: '60000', DATABASE_READINESS_MAX_AGE_MS: '30000', DATABASE_EVIDENCE_MAX_SKEW_MS: '5000',
}

describe('PostgreSQL deployment configuration', () => {
  it('loads safe development defaults', () => {
    expect(loadPostgresDeploymentConfig(base)).toMatchObject({ environment: 'development', migrationOnStartup: true, releaseId: 'local', expectedMigrationBaseline: 1 })
  })
  it('requires production freshness and skew gates', () => {
    for (const name of ['DATABASE_HEALTH_MAX_LATENCY_MS', 'DATABASE_RELEASE_MAX_AGE_MS', 'DATABASE_READINESS_MAX_AGE_MS', 'DATABASE_EVIDENCE_MAX_SKEW_MS'] as const) {
      const env = { ...production }
      delete env[name]
      expect(() => loadPostgresDeploymentConfig(env)).toThrow(name + ' is required in production')
    }
  })
  it('loads complete production gate configuration', () => {
    expect(loadPostgresDeploymentConfig(production)).toMatchObject({ environment: 'production', healthMaxLatencyMs: 200, releaseMaxAgeMs: 60000, readinessMaxAgeMs: 30000, evidenceMaxSkewMs: 5000 })
  })
  it('rejects invalid numeric gate configuration', () => {
    for (const name of ['DATABASE_HEALTH_MAX_LATENCY_MS', 'DATABASE_RELEASE_MAX_AGE_MS', 'DATABASE_READINESS_MAX_AGE_MS', 'DATABASE_EVIDENCE_MAX_SKEW_MS'] as const) {
      expect(() => loadPostgresDeploymentConfig({ ...base, [name]: '0' })).toThrow(name + ' must be a positive integer')
    }
  })
})

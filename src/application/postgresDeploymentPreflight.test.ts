import { describe, expect, it } from 'vitest'
import { verifyPostgresDeploymentPreflight } from './postgresDeploymentPreflight'

const databaseUrl = 'postgresql://user:password@localhost:5432/app'
const productionGates = {
  DATABASE_HEALTH_MAX_LATENCY_MS: '200',
  DATABASE_RELEASE_MAX_AGE_MS: '60000',
  DATABASE_READINESS_MAX_AGE_MS: '30000',
  DATABASE_EVIDENCE_MAX_SKEW_MS: '5000',
}

describe('PostgreSQL deployment preflight', () => {
  it('reports production safety checks', () => {
    expect(verifyPostgresDeploymentPreflight({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATION_APPROVED: 'true', RELEASE_ID: 'release-preflight-test',
      RELEASE_COMMIT_SHA: '84a95cf', DATABASE_EXPECTED_MIGRATION_BASELINE: '2', ...productionGates,
    })).toEqual({
      ready: true,
      checks: [
        'database configuration valid',
        'production SSL enabled',
        'production release identity verified',
        'production migration baseline configured',
        'production migration explicitly approved',
      ],
      failures: [],
    })
  })

  it('reports disabled startup migrations as an explicit production check', () => {
    expect(verifyPostgresDeploymentPreflight({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATE_ON_STARTUP: 'false', RELEASE_ID: 'release-1', RELEASE_COMMIT_SHA: '84a95cf',
      ...productionGates,
    }).checks).toContain('startup migrations disabled')
  })

  it('fails through configuration validation before deployment', () => {
    expect(() => verifyPostgresDeploymentPreflight({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
    })).toThrow('DATABASE_MIGRATION_APPROVED=true is required')
  })

  it('fails production preflight without a release identity', () => {
    expect(() => verifyPostgresDeploymentPreflight({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATE_ON_STARTUP: 'false', ...productionGates,
    })).toThrow('RELEASE_ID is required in production')
  })
})

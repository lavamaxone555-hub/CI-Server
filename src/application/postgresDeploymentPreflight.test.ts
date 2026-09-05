import { describe, expect, it } from 'vitest'
import { verifyPostgresDeploymentPreflight } from './postgresDeploymentPreflight'

const databaseUrl = 'postgresql://user:password@localhost:5432/app'
const releaseCommitSha = '84a95cf'
const healthLimit = '200'

describe('PostgreSQL deployment preflight', () => {
  it('reports production safety checks', () => {
    expect(verifyPostgresDeploymentPreflight({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATION_APPROVED: 'true', RELEASE_ID: 'release-preflight-test',
      RELEASE_COMMIT_SHA: releaseCommitSha, DATABASE_EXPECTED_MIGRATION_BASELINE: '2',
      DATABASE_HEALTH_MAX_LATENCY_MS: healthLimit,
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
      DATABASE_MIGRATE_ON_STARTUP: 'false', RELEASE_ID: 'release-1', RELEASE_COMMIT_SHA: releaseCommitSha,
      DATABASE_HEALTH_MAX_LATENCY_MS: healthLimit,
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
      DATABASE_MIGRATE_ON_STARTUP: 'false', DATABASE_HEALTH_MAX_LATENCY_MS: healthLimit,
    })).toThrow('RELEASE_ID is required in production')
  })
})

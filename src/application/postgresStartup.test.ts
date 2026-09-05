import { describe, expect, it } from 'vitest'
import { checkPostgresReadiness } from './postgresReadiness'
import { startPostgresInfrastructure } from './postgresStartup'

describe('PostgreSQL startup contract', () => {
  it('requires readiness after infrastructure initialization', async () => {
    const readiness = await checkPostgresReadiness({ query: async () => undefined, end: async () => undefined })
    expect(readiness.ready).toBe(true)
  })

  it('does not treat a failed probe as ready', async () => {
    const readiness = await checkPostgresReadiness({ query: async () => { throw new Error('offline') }, end: async () => undefined })
    expect(readiness).toEqual({ ready: false, reason: 'offline' })
  })

  it('rejects invalid health latency limits through centralized deployment validation', async () => {
    await expect(startPostgresInfrastructure({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      DATABASE_HEALTH_MAX_LATENCY_MS: '-1',
    })).rejects.toThrow('DATABASE_HEALTH_MAX_LATENCY_MS must be a positive integer')
  })

  it('rejects incomplete production freshness gates before database startup', async () => {
    await expect(startPostgresInfrastructure({
      NODE_ENV: 'production', DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      DATABASE_SSL: 'true', DATABASE_MIGRATION_APPROVED: 'true',
      RELEASE_ID: 'release-1', RELEASE_COMMIT_SHA: '84a95cf',
      DATABASE_HEALTH_MAX_LATENCY_MS: '200',
    })).rejects.toThrow('DATABASE_RELEASE_MAX_AGE_MS is required in production')
  })
})

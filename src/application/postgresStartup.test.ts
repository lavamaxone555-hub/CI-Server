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

  it('rejects an invalid health latency limit before opening infrastructure', async () => {
    await expect(startPostgresInfrastructure({ DATABASE_HEALTH_MAX_LATENCY_MS: '-1' })).rejects.toThrow(
      'DATABASE_HEALTH_MAX_LATENCY_MS must be a non-negative integer',
    )
  })
})

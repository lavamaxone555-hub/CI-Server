import { describe, expect, it } from 'vitest'
import { checkPostgresReadiness } from './postgresReadiness'

describe('PostgreSQL startup contract', () => {
  it('requires readiness after infrastructure initialization', async () => {
    const readiness = await checkPostgresReadiness({ query: async () => undefined, end: async () => undefined })
    expect(readiness.ready).toBe(true)
  })

  it('does not treat a failed probe as ready', async () => {
    const readiness = await checkPostgresReadiness({ query: async () => { throw new Error('offline') }, end: async () => undefined })
    expect(readiness).toEqual({ ready: false, reason: 'offline' })
  })
})

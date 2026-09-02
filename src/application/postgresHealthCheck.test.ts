import { describe, expect, it } from 'vitest'
import { checkPostgresHealth } from './postgresHealthCheck'

describe('PostgreSQL health check', () => {
  it('reports a successful database probe and latency', async () => {
    const times = [100, 108]
    const result = await checkPostgresHealth(
      { query: async () => undefined, end: async () => undefined },
      () => times.shift() ?? 108,
    )
    expect(result).toEqual({ status: 'ok', latencyMs: 8 })
  })
})

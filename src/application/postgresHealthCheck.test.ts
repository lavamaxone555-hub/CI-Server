import { describe, expect, it } from 'vitest'
import { checkPostgresHealth, verifyPostgresHealth } from './postgresHealthCheck'

describe('PostgreSQL health check', () => {
  it('reports a successful database probe and latency', async () => {
    const times = [100, 108]
    const result = await checkPostgresHealth(
      { query: async () => undefined, end: async () => undefined },
      () => times.shift() ?? 108,
    )
    expect(result).toEqual({ status: 'ok', latencyMs: 8 })
  })

  it('accepts health within an explicit latency limit', async () => {
    const times = [100, 108]
    await expect(verifyPostgresHealth(
      { query: async () => undefined, end: async () => undefined },
      { now: () => times.shift() ?? 108, maxLatencyMs: 10 },
    )).resolves.toEqual({ status: 'ok', latencyMs: 8 })
  })

  it('fails closed when health exceeds an explicit latency limit', async () => {
    const times = [100, 111]
    await expect(verifyPostgresHealth(
      { query: async () => undefined, end: async () => undefined },
      { now: () => times.shift() ?? 111, maxLatencyMs: 10 },
    )).rejects.toThrow('database health latency exceeds limit')
  })
})

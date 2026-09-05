import type { PostgresPool } from './postgresDatabase'

export interface DatabaseHealth { status: 'ok'; latencyMs: number }
export interface PostgresHealthCheckOptions { now?: () => number; maxLatencyMs?: number }

function assertMonotonicLatency(startedAt: number, finishedAt: number): number {
  if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt)) throw new Error('database health clock is invalid')
  const latencyMs = finishedAt - startedAt
  if (latencyMs < 0) throw new Error('database health clock moved backwards')
  return latencyMs
}

export async function checkPostgresHealth(pool: PostgresPool, now: () => number = Date.now): Promise<DatabaseHealth> {
  const startedAt = now()
  await pool.query('SELECT 1')
  return { status: 'ok', latencyMs: assertMonotonicLatency(startedAt, now()) }
}

export async function verifyPostgresHealth(pool: PostgresPool, options: PostgresHealthCheckOptions = {}): Promise<DatabaseHealth> {
  const health = await checkPostgresHealth(pool, options.now ?? Date.now)
  if (options.maxLatencyMs !== undefined) {
    if (!Number.isSafeInteger(options.maxLatencyMs) || options.maxLatencyMs < 1) throw new Error('database health latency limit is invalid')
    if (health.latencyMs > options.maxLatencyMs) throw new Error('database health latency exceeds limit: ' + health.latencyMs + 'ms > ' + options.maxLatencyMs + 'ms')
  }
  return health
}
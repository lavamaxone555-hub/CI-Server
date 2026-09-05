import type { PostgresPool } from './postgresDatabase'

export interface DatabaseHealth {
  status: 'ok'
  latencyMs: number
}

export interface PostgresHealthCheckOptions {
  now?: () => number
  maxLatencyMs?: number
}

export async function checkPostgresHealth(
  pool: PostgresPool,
  now: () => number = Date.now,
): Promise<DatabaseHealth> {
  const startedAt = now()
  await pool.query('SELECT 1')
  return { status: 'ok', latencyMs: now() - startedAt }
}

export async function verifyPostgresHealth(
  pool: PostgresPool,
  options: PostgresHealthCheckOptions = {},
): Promise<DatabaseHealth> {
  const health = await checkPostgresHealth(pool, options.now ?? Date.now)
  if (options.maxLatencyMs !== undefined && health.latencyMs > options.maxLatencyMs) {
    throw new Error(`database health latency exceeds limit: ${health.latencyMs}ms > ${options.maxLatencyMs}ms`)
  }
  return health
}

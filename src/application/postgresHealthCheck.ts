import type { PostgresPool } from './postgresDatabase'

export interface DatabaseHealth {
  status: 'ok'
  latencyMs: number
}

export async function checkPostgresHealth(pool: PostgresPool, now: () => number = Date.now): Promise<DatabaseHealth> {
  const startedAt = now()
  await pool.query('SELECT 1')
  return { status: 'ok', latencyMs: now() - startedAt }
}

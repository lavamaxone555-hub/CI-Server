import { checkPostgresHealth } from './postgresHealthCheck'
import type { PostgresPool } from './postgresDatabase'

export interface PostgresReadiness {
  ready: boolean
  reason?: string
  latencyMs?: number
}

export async function checkPostgresReadiness(pool: PostgresPool): Promise<PostgresReadiness> {
  try {
    const health = await checkPostgresHealth(pool)
    return { ready: true, latencyMs: health.latencyMs }
  } catch (error) {
    return { ready: false, reason: error instanceof Error ? error.message : 'database unavailable' }
  }
}

import { checkPostgresReadiness, type PostgresReadiness } from './postgresReadiness'
import type { PostgresPool } from './postgresDatabase'
import { readAppliedPostgresMigrations } from './postgresMigrationHistory'

export interface PostgresRecoveryReadiness {
  ready: boolean
  checks: string[]
  readiness: PostgresReadiness
  migrationsApplied: number
}

export async function verifyPostgresRecoveryReadiness(
  pool: PostgresPool,
): Promise<PostgresRecoveryReadiness> {
  const readiness = await checkPostgresReadiness(pool)
  if (!readiness.ready) {
    return { ready: false, checks: ['database unreachable'], readiness, migrationsApplied: 0 }
  }

  try {
    const migrations = await readAppliedPostgresMigrations(pool)
    return {
      ready: true,
      checks: ['database reachable', 'migration history readable'],
      readiness,
      migrationsApplied: migrations.length,
    }
  } catch (error) {
    return {
      ready: false,
      checks: ['database reachable', 'migration history unavailable'],
      readiness: {
        ready: false,
        reason: error instanceof Error ? error.message : 'recovery verification failed',
      },
      migrationsApplied: 0,
    }
  }
}

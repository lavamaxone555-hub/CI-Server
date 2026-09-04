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
  expectedMinimumMigrations = 1,
): Promise<PostgresRecoveryReadiness> {
  const readiness = await checkPostgresReadiness(pool)
  if (!readiness.ready) {
    return { ready: false, checks: ['database unreachable'], readiness, migrationsApplied: 0 }
  }

  try {
    const migrations = await readAppliedPostgresMigrations(pool)
    if (migrations.length < expectedMinimumMigrations) {
      return {
        ready: false,
        checks: ['database reachable', 'migration history below recovery baseline'],
        readiness: { ready: false, reason: 'migration history is below the expected recovery baseline' },
        migrationsApplied: migrations.length,
      }
    }
    return {
      ready: true,
      checks: ['database reachable', 'migration history readable', 'recovery baseline verified'],
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

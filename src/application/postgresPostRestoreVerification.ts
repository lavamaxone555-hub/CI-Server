import { checkPostgresReadiness, type PostgresReadiness } from './postgresReadiness'
import type { PostgresPool } from './postgresDatabase'
import { readAppliedPostgresMigrations } from './postgresMigrationHistory'

export interface PostgresPostRestoreVerification {
  ready: boolean
  checks: string[]
  readiness: PostgresReadiness
  migrationsApplied: number
}

export async function verifyPostgresPostRestore(
  pool: PostgresPool,
  expectedMinimumMigrations = 1,
): Promise<PostgresPostRestoreVerification> {
  const readiness = await checkPostgresReadiness(pool)
  if (!readiness.ready) {
    return { ready: false, checks: ['database unreachable'], readiness, migrationsApplied: 0 }
  }

  try {
    const migrations = await readAppliedPostgresMigrations(pool)
    if (migrations.length < expectedMinimumMigrations) {
      return {
        ready: false,
        checks: ['database reachable', 'migration history incomplete'],
        readiness: { ready: false, reason: 'migration history is below the expected recovery baseline' },
        migrationsApplied: migrations.length,
      }
    }
    return {
      ready: true,
      checks: ['database reachable', 'migration history meets recovery baseline'],
      readiness,
      migrationsApplied: migrations.length,
    }
  } catch (error) {
    return {
      ready: false,
      checks: ['database reachable', 'post-restore verification failed'],
      readiness: {
        ready: false,
        reason: error instanceof Error ? error.message : 'post-restore verification failed',
      },
      migrationsApplied: 0,
    }
  }
}

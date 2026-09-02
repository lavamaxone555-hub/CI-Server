import { checkPostgresReadiness, type PostgresReadiness } from './postgresReadiness'
import type { PostgresPool } from './postgresDatabase'
import { readAppliedPostgresMigrations } from './postgresMigrationHistory'

export interface PostgresDeploymentVerification {
  ready: boolean
  migrationsApplied: number
  readiness: PostgresReadiness
}

export async function verifyPostgresDeployment(
  pool: PostgresPool,
): Promise<PostgresDeploymentVerification> {
  const readiness = await checkPostgresReadiness(pool)
  if (!readiness.ready) {
    return { ready: false, migrationsApplied: 0, readiness }
  }
  try {
    const migrations = await readAppliedPostgresMigrations(pool)
    return { ready: true, migrationsApplied: migrations.length, readiness }
  } catch (error) {
    return {
      ready: false,
      migrationsApplied: 0,
      readiness: {
        ready: false,
        reason: error instanceof Error ? error.message : 'migration verification failed',
      },
    }
  }
}

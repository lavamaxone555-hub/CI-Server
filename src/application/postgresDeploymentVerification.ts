import { checkPostgresReadiness, type PostgresReadiness } from './postgresReadiness'
import type { PostgresPool } from './postgresDatabase'
import { readAppliedPostgresMigrations } from './postgresMigrationHistory'

export interface PostgresDeploymentVerification {
  ready: boolean
  migrationsApplied: number
  migrationBaselineVerified: boolean
  readiness: PostgresReadiness
}

export async function verifyPostgresDeployment(
  pool: PostgresPool,
  expectedMigrationBaseline?: number,
): Promise<PostgresDeploymentVerification> {
  const readiness = await checkPostgresReadiness(pool)
  if (!readiness.ready) {
    return { ready: false, migrationsApplied: 0, migrationBaselineVerified: false, readiness }
  }
  try {
    const migrations = await readAppliedPostgresMigrations(pool)
    const migrationBaselineVerified = expectedMigrationBaseline === undefined
      ? migrations.length > 0
      : migrations.length >= expectedMigrationBaseline
    return {
      ready: migrationBaselineVerified,
      migrationsApplied: migrations.length,
      migrationBaselineVerified,
      readiness: migrationBaselineVerified ? readiness : {
        ready: false,
        reason: 'migration baseline is below the expected level',
      },
    }
  } catch (error) {
    return {
      ready: false,
      migrationsApplied: 0,
      migrationBaselineVerified: false,
      readiness: {
        ready: false,
        reason: error instanceof Error ? error.message : 'migration verification failed',
      },
    }
  }
}

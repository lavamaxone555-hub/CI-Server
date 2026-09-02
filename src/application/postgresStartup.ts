import { initializePostgresDatabase } from './postgresIntegration'
import type { PostgresReadiness } from './postgresReadiness'
import { createPostgresPool } from './postgresDatabase'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'
import { verifyPostgresDeployment } from './postgresDeploymentVerification'
import { verifyPostgresDeploymentPreflight } from './postgresDeploymentPreflight'
import { verifyPostgresRecoveryReadiness } from './postgresRecoveryReadiness'

export interface PostgresStartupResult {
  migrations: string[]
  readiness: PostgresReadiness
  migrationsApplied: number
  preflightChecks: string[]
  recoveryChecks: string[]
}

export async function startPostgresInfrastructure(
  env: Record<string, string | undefined> = process.env,
): Promise<PostgresStartupResult> {
  const preflight = verifyPostgresDeploymentPreflight(env)
  if (!preflight.ready) throw new Error('database deployment preflight failed')

  const config = loadPostgresDeploymentConfig(env)
  const migrations = config.migrationOnStartup ? await initializePostgresDatabase(env) : []
  const pool = createPostgresPool(env)
  try {
    const verification = await verifyPostgresDeployment(pool)
    if (!verification.ready) {
      throw new Error(verification.readiness.reason ?? 'database deployment verification failed')
    }
    const recovery = await verifyPostgresRecoveryReadiness(pool)
    if (!recovery.ready) {
      throw new Error(recovery.readiness.reason ?? 'database recovery verification failed')
    }
    return {
      migrations,
      readiness: verification.readiness,
      migrationsApplied: verification.migrationsApplied,
      preflightChecks: preflight.checks,
      recoveryChecks: recovery.checks,
    }
  } finally {
    await pool.end()
  }
}

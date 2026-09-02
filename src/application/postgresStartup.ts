import { initializePostgresDatabase } from './postgresIntegration'
import type { PostgresReadiness } from './postgresReadiness'
import { createPostgresPool } from './postgresDatabase'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'
import { verifyPostgresDeployment } from './postgresDeploymentVerification'

export interface PostgresStartupResult {
  migrations: string[]
  readiness: PostgresReadiness
  migrationsApplied: number
}

export async function startPostgresInfrastructure(
  env: Record<string, string | undefined> = process.env,
): Promise<PostgresStartupResult> {
  const config = loadPostgresDeploymentConfig(env)
  const migrations = config.migrationOnStartup ? await initializePostgresDatabase(env) : []
  const pool = createPostgresPool(env)
  try {
    const verification = await verifyPostgresDeployment(pool)
    if (!verification.ready) {
      throw new Error(verification.readiness.reason ?? 'database deployment verification failed')
    }
    return {
      migrations,
      readiness: verification.readiness,
      migrationsApplied: verification.migrationsApplied,
    }
  } finally {
    await pool.end()
  }
}

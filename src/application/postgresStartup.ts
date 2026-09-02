import { initializePostgresDatabase } from './postgresIntegration'
import { checkPostgresReadiness, type PostgresReadiness } from './postgresReadiness'
import { createPostgresPool } from './postgresDatabase'

export interface PostgresStartupResult {
  migrations: string[]
  readiness: PostgresReadiness
}

export async function startPostgresInfrastructure(
  env: Record<string, string | undefined> = process.env,
): Promise<PostgresStartupResult> {
  const migrations = await initializePostgresDatabase(env)
  const pool = createPostgresPool(env)
  try {
    const readiness = await checkPostgresReadiness(pool)
    if (!readiness.ready) throw new Error(readiness.reason ?? 'database unavailable')
    return { migrations, readiness }
  } finally {
    await pool.end()
  }
}

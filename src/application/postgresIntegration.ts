import { join } from 'node:path'
import { loadDatabaseConfig } from './databaseConfig'
import { runMigrations } from './migrationRunner'
import { createPostgresMigrationExecutor } from './postgresMigrationExecutor'
import { createPostgresPool, verifyPostgresConnection, type PostgresPool } from './postgresDatabase'

export async function initializePostgresDatabase(
  env: Record<string, string | undefined> = process.env,
  migrationsDirectory = join(process.cwd(), 'database', 'migrations'),
): Promise<string[]> {
  loadDatabaseConfig(env)
  const pool = createPostgresPool(env)
  try {
    await verifyPostgresConnection(pool)
    return await runMigrations(createPostgresMigrationExecutor(pool), migrationsDirectory)
  } finally {
    await pool.end()
  }
}

export async function withPostgresPool<T>(
  env: Record<string, string | undefined>,
  operation: (pool: PostgresPool) => Promise<T>,
): Promise<T> {
  const pool = createPostgresPool(env)
  try {
    return await operation(pool)
  } finally {
    await pool.end()
  }
}

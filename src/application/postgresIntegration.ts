import { join } from 'node:path'
import { loadDatabaseConfig } from './databaseConfig'
import { listMigrations, runMigrationsTransactionally } from './migrationRunner'
import {
  assertMigrationNamesAreOrdered,
  assertMigrationPlan,
  assertMigrationsAreUnique,
  assertMigrationsAvailable,
} from './migrationSafety'
import { createPostgresMigrationExecutor } from './postgresMigrationExecutor'
import { withPostgresMigrationLock } from './postgresMigrationLock'
import { createPostgresPool, verifyPostgresConnection, type PostgresPool } from './postgresDatabase'

export async function initializePostgresDatabase(
  env: Record<string, string | undefined> = process.env,
  migrationsDirectory = join(process.cwd(), 'database', 'migrations'),
): Promise<string[]> {
  loadDatabaseConfig(env)
  const planned = await listMigrations(migrationsDirectory)
  assertMigrationsAvailable(planned)
  assertMigrationsAreUnique(planned)
  assertMigrationNamesAreOrdered(planned)
  const pool = createPostgresPool(env)
  try {
    await verifyPostgresConnection(pool)
    const executed = await withPostgresMigrationLock(pool, async () =>
      runMigrationsTransactionally(createPostgresMigrationExecutor(pool), migrationsDirectory),
    )
    assertMigrationPlan(planned, executed)
    return executed
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

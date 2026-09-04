import { join } from 'node:path'
import { loadDatabaseConfig } from './databaseConfig'
import { loadMigrationSources } from './migrationRunner'
import { pendingMigrations } from './migrationHistory'
import {
  assertMigrationNamesAreOrdered,
  assertMigrationsAreUnique,
  assertMigrationsAvailable,
} from './migrationSafety'
import { createPostgresMigrationExecutor } from './postgresMigrationExecutor'
import { withPostgresMigrationLock } from './postgresMigrationLock'
import {
  ensurePostgresMigrationHistory,
  readAppliedPostgresMigrations,
  recordAppliedPostgresMigration,
} from './postgresMigrationHistory'
import { createPostgresPool, verifyPostgresConnection, type PostgresPool } from './postgresDatabase'

export async function initializePostgresDatabase(
  env: Record<string, string | undefined> = process.env,
  migrationsDirectory = join(process.cwd(), 'database', 'migrations'),
): Promise<string[]> {
  loadDatabaseConfig(env)
  const planned = await loadMigrationSources(migrationsDirectory)
  const names = planned.map((migration) => migration.name)
  assertMigrationsAvailable(names)
  assertMigrationsAreUnique(names)
  assertMigrationNamesAreOrdered(names)
  const pool = createPostgresPool(env)
  try {
    await verifyPostgresConnection(pool)
    return await withPostgresMigrationLock(pool, async (client) => {
      await ensurePostgresMigrationHistory(client)
      const pending = pendingMigrations(planned, await readAppliedPostgresMigrations(client))
      if (pending.length === 0) return []
      const executor = createPostgresMigrationExecutor(client)
      await executor.begin()
      let commitAttempted = false
      try {
        for (const migration of pending) {
          await executor.execute(migration.sql)
          await recordAppliedPostgresMigration(client, migration)
        }
        commitAttempted = true
        await executor.commit()
        return pending.map((migration) => migration.name)
      } catch (error) {
        if (commitAttempted) throw error
        try {
          await executor.rollback()
        } catch (rollbackError) {
          throw new AggregateError(
            [error instanceof Error ? error : new Error(String(error)), rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError))],
            `migration failed and rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
            { cause: error instanceof Error ? error : new Error(String(error)) },
          )
        }
        throw error
      }
    })
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

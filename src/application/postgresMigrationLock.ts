import type { PostgresPool } from './postgresDatabase'

export const POSTGRES_MIGRATION_LOCK_ID = 73910421

export async function withPostgresMigrationLock<T>(
  pool: PostgresPool,
  operation: () => Promise<T>,
): Promise<T> {
  await pool.query(`SELECT pg_advisory_lock(${POSTGRES_MIGRATION_LOCK_ID})`)
  try {
    return await operation()
  } finally {
    await pool.query(`SELECT pg_advisory_unlock(${POSTGRES_MIGRATION_LOCK_ID})`)
  }
}

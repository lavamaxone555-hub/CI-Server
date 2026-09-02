import type { AppliedMigration } from './migrationHistory'
import type { PostgresPool } from './postgresDatabase'

interface QueryResult {
  rows: AppliedMigration[]
}

export async function ensurePostgresMigrationHistory(pool: PostgresPool): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
}

export async function readAppliedPostgresMigrations(pool: PostgresPool): Promise<AppliedMigration[]> {
  const result = await pool.query(
    'SELECT name, checksum FROM schema_migrations ORDER BY name',
  ) as QueryResult
  return result.rows
}

export async function recordAppliedPostgresMigration(
  pool: PostgresPool,
  migration: AppliedMigration,
): Promise<void> {
  await pool.query(
    'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
    [migration.name, migration.checksum],
  )
}

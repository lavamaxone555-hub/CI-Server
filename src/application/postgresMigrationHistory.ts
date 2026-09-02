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

export async function verifyPostgresMigrationHistory(
  pool: PostgresPool,
  expected: readonly AppliedMigration[],
): Promise<void> {
  const applied = await readAppliedPostgresMigrations(pool)
  const expectedByName = new Map(expected.map((migration) => [migration.name, migration.checksum]))
  for (const migration of applied) {
    const expectedChecksum = expectedByName.get(migration.name)
    if (expectedChecksum === undefined) {
      throw new Error(`unexpected applied migration: ${migration.name}`)
    }
    if (expectedChecksum !== migration.checksum) {
      throw new Error(`migration checksum mismatch: ${migration.name}`)
    }
  }
  if (applied.length !== expected.length) {
    throw new Error(`migration history count mismatch: expected ${expected.length}, received ${applied.length}`)
  }
}

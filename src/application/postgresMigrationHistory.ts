import type { AppliedMigration } from './migrationHistory'
import type { PostgresQueryClient } from './postgresDatabase'

interface QueryResult {
  rows: AppliedMigration[]
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value, (character) => character.charCodeAt(0)).some((code) => code <= 0x1f || code === 0x7f)
}

function assertValidAppliedMigration(migration: AppliedMigration): void {
  if (migration.name.normalize('NFC').trim() !== migration.name || hasControlCharacters(migration.name) || !migration.name || migration.name.startsWith('/') || migration.name.includes('\\') || migration.name.split('/').includes('..')) {
    throw new Error(`unsafe applied migration name: ${migration.name}`)
  }
  if (migration.checksum.normalize('NFC').trim() !== migration.checksum || hasControlCharacters(migration.checksum) || !migration.checksum) {
    throw new Error(`invalid applied migration checksum: ${migration.name}`)
  }
}

export async function ensurePostgresMigrationHistory(pool: PostgresQueryClient): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
}

export async function readAppliedPostgresMigrations(pool: PostgresQueryClient): Promise<AppliedMigration[]> {
  const result = await pool.query(
    'SELECT name, checksum FROM schema_migrations ORDER BY name',
  ) as QueryResult
  for (const migration of result.rows) assertValidAppliedMigration(migration)
  return result.rows
}

export async function recordAppliedPostgresMigration(
  pool: PostgresQueryClient,
  migration: AppliedMigration,
): Promise<void> {
  assertValidAppliedMigration(migration)
  await pool.query(
    'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
    [migration.name, migration.checksum],
  )
}

export async function verifyPostgresMigrationHistory(
  pool: PostgresQueryClient,
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

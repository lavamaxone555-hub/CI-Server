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
  const migrationsByName = new Map<string, string>()
  for (const migration of result.rows) {
    assertValidAppliedMigration(migration)
    const previousChecksum = migrationsByName.get(migration.name)
    if (previousChecksum !== undefined && previousChecksum !== migration.checksum) {
      throw new Error(`duplicate applied migration checksum mismatch: ${migration.name}`)
    }
    if (previousChecksum !== undefined) throw new Error(`duplicate applied migration name: ${migration.name}`)
    migrationsByName.set(migration.name, migration.checksum)
  }
  return result.rows
}

export async function recordAppliedPostgresMigration(
  pool: PostgresQueryClient,
  migration: AppliedMigration,
): Promise<void> {
  assertValidAppliedMigration(migration)
  try {
    await pool.query(
      'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
      [migration.name, migration.checksum],
    )
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : undefined
    if (code === '23505') throw new Error(`migration already recorded: ${migration.name}`)
    throw error
  }
}

export async function verifyPostgresMigrationHistory(
  pool: PostgresQueryClient,
  expected: readonly AppliedMigration[],
): Promise<void> {
  for (const migration of expected) assertValidAppliedMigration(migration)
  const expectedByName = new Map<string, string>()
  let previousExpectedName: string | undefined
  for (const migration of expected) {
    if (previousExpectedName !== undefined && migration.name <= previousExpectedName) {
      throw new Error(`expected migration baseline is not strictly ordered: ${migration.name}`)
    }
    previousExpectedName = migration.name
    const previousChecksum = expectedByName.get(migration.name)
    if (previousChecksum !== undefined && previousChecksum !== migration.checksum) {
      throw new Error(`duplicate expected migration checksum mismatch: ${migration.name}`)
    }
    if (previousChecksum !== undefined) throw new Error(`duplicate expected migration name: ${migration.name}`)
    expectedByName.set(migration.name, migration.checksum)
  }
  const applied = await readAppliedPostgresMigrations(pool)
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

import { describe, expect, it } from 'vitest'
import {
  ensurePostgresMigrationHistory,
  readAppliedPostgresMigrations,
  recordAppliedPostgresMigration,
} from './postgresMigrationHistory'

describe('PostgreSQL migration history', () => {
  it('creates, reads, and records migration history', async () => {
    const statements: Array<{ sql: string, parameters?: unknown[] }> = []
    const rows: Array<{ name: string, checksum: string }> = []
    const pool = {
      query: async (sql: string, parameters?: unknown[]) => {
        statements.push({ sql, parameters })
        if (sql.startsWith('INSERT')) rows.push({ name: parameters?.[0] as string, checksum: parameters?.[1] as string })
        if (sql.startsWith('SELECT')) return { rows }
        return { rows: [] }
      },
      end: async () => {},
    }
    await ensurePostgresMigrationHistory(pool)
    await recordAppliedPostgresMigration(pool, { name: '001.sql', checksum: 'abc' })
    await expect(readAppliedPostgresMigrations(pool)).resolves.toEqual([{ name: '001.sql', checksum: 'abc' }])
    expect(statements.some((statement) => statement.sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations'))).toBe(true)
  })
})

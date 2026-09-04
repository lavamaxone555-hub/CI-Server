import { describe, expect, it } from 'vitest'
import {
  ensurePostgresMigrationHistory,
  readAppliedPostgresMigrations,
  recordAppliedPostgresMigration,
  verifyPostgresMigrationHistory,
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

  it('verifies migration history against expected checksums', async () => {
    const pool = {
      query: async () => ({ rows: [{ name: '001.sql', checksum: 'abc' }] }),
      end: async () => {},
    }
    await expect(verifyPostgresMigrationHistory(pool, [{ name: '001.sql', checksum: 'abc' }])).resolves.toBeUndefined()
  })

  it('rejects unexpected applied migrations', async () => {
    const pool = {
      query: async () => ({ rows: [{ name: '999.sql', checksum: 'abc' }] }),
      end: async () => {},
    }
    await expect(verifyPostgresMigrationHistory(pool, [])).rejects.toThrow('unexpected applied migration: 999.sql')
  })

  it('rejects checksum drift', async () => {
    const pool = {
      query: async () => ({ rows: [{ name: '001.sql', checksum: 'drift' }] }),
      end: async () => {},
    }
    await expect(verifyPostgresMigrationHistory(pool, [{ name: '001.sql', checksum: 'abc' }]))
      .rejects.toThrow('migration checksum mismatch: 001.sql')
  })

  it('rejects unsafe applied migration names', async () => {
    const pool = {
      query: async () => ({ rows: [{ name: '../001.sql', checksum: 'abc' }] }),
      end: async () => {},
    }
    await expect(readAppliedPostgresMigrations(pool)).rejects.toThrow('unsafe applied migration name')
  })

  it('rejects non-canonical or whitespace-padded migration records from the database', async () => {
    const paddedNamePool = { query: async () => ({ rows: [{ name: ' 001.sql', checksum: 'abc' }] }), end: async () => {} }
    await expect(readAppliedPostgresMigrations(paddedNamePool)).rejects.toThrow('unsafe applied migration name')
    const paddedChecksumPool = { query: async () => ({ rows: [{ name: '001.sql', checksum: ' abc ' }] }), end: async () => {} }
    await expect(readAppliedPostgresMigrations(paddedChecksumPool)).rejects.toThrow('invalid applied migration checksum')
  })

  it('rejects blank or control-character checksums from the database', async () => {
    const blankChecksumPool = {
      query: async () => ({ rows: [{ name: '001.sql', checksum: '   ' }] }),
      end: async () => {},
    }
    await expect(readAppliedPostgresMigrations(blankChecksumPool)).rejects.toThrow('invalid applied migration checksum')

    const controlChecksumPool = {
      query: async () => ({ rows: [{ name: '001.sql', checksum: 'abc\nforged' }] }),
      end: async () => {},
    }
    await expect(readAppliedPostgresMigrations(controlChecksumPool)).rejects.toThrow('invalid applied migration checksum')
  })

  it('rejects invalid or duplicate expected migration baselines', async () => {
    const pool = { query: async () => ({ rows: [{ name: '001.sql', checksum: 'abc' }] }), end: async () => {} }
    await expect(verifyPostgresMigrationHistory(pool, [{ name: ' 001.sql', checksum: 'abc' }]))
      .rejects.toThrow('unsafe applied migration name')
    await expect(verifyPostgresMigrationHistory(pool, [
      { name: '001.sql', checksum: 'abc' },
      { name: '001.sql', checksum: 'abc' },
    ])).rejects.toThrow('duplicate expected migration name: 001.sql')
    await expect(verifyPostgresMigrationHistory(pool, [
      { name: '001.sql', checksum: 'abc' },
      { name: '001.sql', checksum: 'drift' },
    ])).rejects.toThrow('duplicate expected migration checksum mismatch: 001.sql')
  })

  it('rejects invalid migration records before persistence', async () => {
    const pool = { query: async () => ({ rows: [] }), end: async () => {} }
    await expect(recordAppliedPostgresMigration(pool, { name: '001.sql', checksum: '' }))
      .rejects.toThrow('invalid applied migration checksum')
  })
})

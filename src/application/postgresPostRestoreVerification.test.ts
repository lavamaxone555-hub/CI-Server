import { describe, expect, it } from 'vitest'
import { verifyPostgresPostRestore } from './postgresPostRestoreVerification'

describe('PostgreSQL post-restore verification', () => {
  it('passes when recovery baseline migration history is present', async () => {
    const pool = {
      query: async (sql: string) => sql === 'SELECT 1'
        ? { rows: [] }
        : { rows: [{ name: '001.sql', checksum: 'abc' }, { name: '002.sql', checksum: 'def' }] },
      end: async () => {},
    }
    await expect(verifyPostgresPostRestore(pool, 2)).resolves.toMatchObject({ ready: true, migrationsApplied: 2 })
  })

  it('rejects a restored database below the recovery baseline', async () => {
    const pool = {
      query: async (sql: string) => sql === 'SELECT 1'
        ? { rows: [] }
        : { rows: [{ name: '001.sql', checksum: 'abc' }] },
      end: async () => {},
    }
    await expect(verifyPostgresPostRestore(pool, 2)).resolves.toMatchObject({ ready: false, migrationsApplied: 1 })
  })

  it('rejects a restored database with migration integrity drift', async () => {
    const pool = {
      query: async (sql: string) => sql === 'SELECT 1'
        ? { rows: [] }
        : { rows: [{ name: '001.sql', checksum: 'tampered' }] },
      end: async () => {},
    }
    const expected = [{ name: '001.sql', checksum: 'expected' }]
    await expect(verifyPostgresPostRestore(pool, 1, expected)).resolves.toMatchObject({
      ready: false,
      readiness: { ready: false, reason: 'migration checksum mismatch: 001.sql' },
    })
  })
})

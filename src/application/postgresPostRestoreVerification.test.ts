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
    await expect(verifyPostgresPostRestore(pool, 2)).resolves.toMatchObject({
      ready: true,
      migrationsApplied: 2,
      checks: ['database reachable', 'migration history meets recovery baseline'],
    })
  })

  it('fails when restored migration history is below the expected baseline', async () => {
    const pool = {
      query: async (sql: string) => sql === 'SELECT 1'
        ? { rows: [] }
        : { rows: [{ name: '001.sql', checksum: 'abc' }] },
      end: async () => {},
    }
    await expect(verifyPostgresPostRestore(pool, 2)).resolves.toMatchObject({
      ready: false,
      migrationsApplied: 1,
      readiness: { ready: false, reason: 'migration history is below the expected recovery baseline' },
    })
  })

  it('fails when the restored database is unreachable', async () => {
    const pool = { query: async () => { throw new Error('connection refused') }, end: async () => {} }
    await expect(verifyPostgresPostRestore(pool)).resolves.toMatchObject({
      ready: false,
      checks: ['database unreachable'],
    })
  })
})

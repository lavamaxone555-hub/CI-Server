import { describe, expect, it } from 'vitest'
import { verifyPostgresRecoveryReadiness } from './postgresRecoveryReadiness'

describe('PostgreSQL recovery readiness', () => {
  it('confirms a recovered database is reachable with readable migration history at the recovery baseline', async () => {
    const pool = {
      query: async (sql: string) => {
        if (sql === 'SELECT 1') return { rows: [] }
        return { rows: [{ name: '001.sql', checksum: 'abc' }] }
      },
      end: async () => {},
    }
    await expect(verifyPostgresRecoveryReadiness(pool, 1)).resolves.toMatchObject({
      ready: true,
      migrationsApplied: 1,
      checks: ['database reachable', 'migration history readable', 'recovery baseline verified'],
    })
  })

  it('blocks recovery verification when the restored migration history is below the recovery baseline', async () => {
    const pool = {
      query: async (sql: string) => {
        if (sql === 'SELECT 1') return { rows: [] }
        return { rows: [{ name: '001.sql', checksum: 'abc' }] }
      },
      end: async () => {},
    }
    await expect(verifyPostgresRecoveryReadiness(pool, 2)).resolves.toMatchObject({
      ready: false,
      migrationsApplied: 1,
      checks: ['database reachable', 'migration history below recovery baseline'],
      readiness: { ready: false, reason: 'migration history is below the expected recovery baseline' },
    })
  })

  it('blocks recovery verification when the database is unreachable', async () => {
    const pool = {
      query: async () => { throw new Error('connection refused') },
      end: async () => {},
    }
    await expect(verifyPostgresRecoveryReadiness(pool)).resolves.toMatchObject({
      ready: false,
      migrationsApplied: 0,
      checks: ['database unreachable'],
    })
  })
})

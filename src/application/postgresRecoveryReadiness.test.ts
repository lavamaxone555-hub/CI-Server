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
    })
  })

  it('rejects recovery below the configured baseline', async () => {
    const pool = {
      query: async (sql: string) => sql === 'SELECT 1' ? { rows: [] } : { rows: [] },
      end: async () => {},
    }
    await expect(verifyPostgresRecoveryReadiness(pool, 1)).resolves.toMatchObject({
      ready: false,
      migrationsApplied: 0,
    })
  })

  it('rejects a recovered database with migration integrity drift', async () => {
    const pool = {
      query: async (sql: string) => {
        if (sql === 'SELECT 1') return { rows: [] }
        return { rows: [{ name: '001.sql', checksum: 'tampered' }] }
      },
      end: async () => {},
    }
    const expected = [{ name: '001.sql', checksum: 'expected' }]
    await expect(verifyPostgresRecoveryReadiness(pool, 1, expected)).resolves.toMatchObject({
      ready: false,
      readiness: { ready: false, reason: 'migration checksum mismatch: 001.sql' },
    })
  })
})

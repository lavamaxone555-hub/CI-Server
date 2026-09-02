import { describe, expect, it } from 'vitest'
import { verifyPostgresDeployment } from './postgresDeploymentVerification'

describe('PostgreSQL deployment verification', () => {
  it('passes when the database is healthy and migration history is readable', async () => {
    const pool = {
      query: async (sql: string) => {
        if (sql === 'SELECT 1') return { rows: [] }
        return { rows: [{ name: '001.sql', checksum: 'abc' }] }
      },
      end: async () => {},
    }
    await expect(verifyPostgresDeployment(pool)).resolves.toMatchObject({
      ready: true,
      migrationsApplied: 1,
      readiness: { ready: true },
    })
  })

  it('fails the deployment gate when readiness fails', async () => {
    const pool = {
      query: async () => { throw new Error('connection refused') },
      end: async () => {},
    }
    await expect(verifyPostgresDeployment(pool)).resolves.toMatchObject({
      ready: false,
      migrationsApplied: 0,
      readiness: { ready: false, reason: 'connection refused' },
    })
  })
})

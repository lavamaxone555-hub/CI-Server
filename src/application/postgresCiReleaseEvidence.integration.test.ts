import { describe, expect, it } from 'vitest'
import { createPostgresPool } from './postgresDatabase'
import { initializePostgresDatabase } from './postgresIntegration'
import { readAppliedPostgresMigrations } from './postgresMigrationHistory'
import { createPostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'
import { verifyPostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'

const url = process.env.POSTGRES_INTEGRATION_URL

describe.runIf(url)('PostgreSQL CI release evidence integration', () => {
  const env = {
    DATABASE_URL: url,
    DATABASE_SSL: process.env.POSTGRES_INTEGRATION_SSL ?? 'false',
    NODE_ENV: 'test',
  }

  it('verifies evidence against the live migration baseline', async () => {
    await initializePostgresDatabase(env)
    const pool = createPostgresPool(env)
    try {
      const migrations = await readAppliedPostgresMigrations(pool)
      expect(migrations.length).toBeGreaterThan(0)

      const audit = createPostgresReleaseAuditRecord({
        environment: 'production',
        evidenceReady: true,
        releaseApproved: true,
        migrationsApplied: migrations.length,
        checks: ['live PostgreSQL reachable', 'live migration history readable'],
      })

      expect(verifyPostgresCiReleaseEvidence(audit)).toEqual({
        verified: true,
        summary: 'postgres release evidence verified',
        audit,
      })
    } finally {
      await pool.end()
    }
  })
})

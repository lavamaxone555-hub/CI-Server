import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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

  beforeAll(async () => {
    await initializePostgresDatabase(env)
  })

  afterAll(async () => {
    const pool = createPostgresPool(env)
    await pool.end()
  })

  it('verifies evidence against the live migration baseline', async () => {
    const pool = createPostgresPool(env)
    try {
      const migrations = await readAppliedPostgresMigrations(pool)
      const audit = createPostgresReleaseAuditRecord({
        environment: 'production',
        evidenceReady: true,
        releaseApproved: true,
        migrationsApplied: migrations.length,
        checks: ['live PostgreSQL reachable', 'live migration history readable'],
      })
      expect(verifyPostgresCiReleaseEvidence(audit)).toMatchObject({
        verified: migrations.length > 0,
      })
    } finally {
      await pool.end()
    }
  })
})

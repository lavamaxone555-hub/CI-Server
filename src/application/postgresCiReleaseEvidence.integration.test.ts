import { describe, expect, it } from 'vitest'
import { createPostgresPool } from './postgresDatabase'
import { initializePostgresDatabase } from './postgresIntegration'
import { readAppliedPostgresMigrations } from './postgresMigrationHistory'
import { createPostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'
import { assertPostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'
import { createPostgresCiReleaseEvidenceReport } from './postgresCiReleaseEvidenceReport'

const url = process.env.POSTGRES_INTEGRATION_URL

describe.runIf(url)('PostgreSQL CI release evidence integration', () => {
  const env = {
    DATABASE_URL: url,
    DATABASE_SSL: process.env.POSTGRES_INTEGRATION_SSL ?? 'false',
    NODE_ENV: 'test',
  }

  it('enforces evidence against the live migration baseline', async () => {
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
        expectedMigrationBaseline: migrations.length,
        releaseId: 'ci-live-release',
        releaseCommitSha: process.env.GITHUB_SHA ?? '0000000',
        checks: ['live PostgreSQL reachable', 'live migration history readable'],
      })

      const evidence = assertPostgresCiReleaseEvidence(audit)
      const report = createPostgresCiReleaseEvidenceReport(evidence)
      expect(report.status).toBe('passed')
      expect(report.details).toHaveLength(8)
    } finally {
      await pool.end()
    }
  })
})

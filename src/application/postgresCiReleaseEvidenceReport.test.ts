import { describe, expect, it } from 'vitest'
import { createPostgresCiReleaseEvidenceReport } from './postgresCiReleaseEvidenceReport'

describe('PostgreSQL CI release evidence report', () => {
  const audit = {
    event: 'postgres-release-verification' as const,
    environment: 'production' as const,
    evidenceReady: true,
    releaseApproved: true,
    migrationsApplied: 2,
    expectedMigrationBaseline: 2,
    releaseId: 'release-1',
    createdAt: '2026-09-03T00:00:00.000Z',
    releaseCommitSha: '84a95cf',
    checks: ['preflight passed'],
  }

  it('creates a complete passed report for verified production evidence', () => {
    expect(createPostgresCiReleaseEvidenceReport({
      verified: true,
      summary: 'postgres release evidence verified',
      failures: [],
      audit,
    })).toEqual({
      status: 'passed',
      summary: 'postgres release evidence verified',
      details: [
        'deployment evidence verified',
        'release approved',
        'migration baseline verified',
        'verification checks present',
        'release identity verified',
        'release timestamp verified',
        'release commit identity verified',
        'audited migration baseline verified',
      ],
    })
  })

  it('keeps non-production reports free of production-only claims', () => {
    const testAudit = { ...audit, environment: 'test' as const, releaseCommitSha: undefined }
    expect(createPostgresCiReleaseEvidenceReport({
      verified: true,
      summary: 'postgres release evidence verified',
      failures: [],
      audit: testAudit,
    }).details).not.toContain('release commit identity verified')
  })

  it('preserves failed CI diagnostics in the report', () => {
    expect(createPostgresCiReleaseEvidenceReport({
      verified: false,
      summary: 'postgres release evidence verification failed',
      failures: ['migration baseline is missing'],
      audit,
    })).toEqual({
      status: 'failed',
      summary: 'postgres release evidence verification failed',
      details: ['migration baseline is missing'],
    })
  })
})

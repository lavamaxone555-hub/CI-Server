import { describe, expect, it } from 'vitest'
import { createPostgresCiReleaseEvidenceReport } from './postgresCiReleaseEvidenceReport'

describe('PostgreSQL CI release evidence report', () => {
  const audit = {
    event: 'postgres-release-verification' as const,
    environment: 'production' as const,
    evidenceReady: true,
    releaseApproved: true,
    migrationsApplied: 2,
    checks: ['preflight passed'],
  }

  it('creates a passed report for verified evidence', () => {
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
      ],
    })
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

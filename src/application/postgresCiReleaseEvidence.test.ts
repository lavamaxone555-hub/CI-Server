import { describe, expect, it } from 'vitest'
import { verifyPostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'

describe('PostgreSQL CI release evidence', () => {
  const audit = {
    event: 'postgres-release-verification' as const,
    environment: 'production' as const,
    evidenceReady: true,
    releaseApproved: true,
    migrationsApplied: 2,
    checks: ['preflight passed'],
  }

  it('verifies complete release evidence for CI', () => {
    expect(verifyPostgresCiReleaseEvidence(audit)).toMatchObject({
      verified: true,
      summary: 'postgres release evidence verified',
      failures: [],
    })
  })

  it('reports the exact failed CI gates', () => {
    expect(verifyPostgresCiReleaseEvidence({
      ...audit,
      evidenceReady: false,
      releaseApproved: false,
      migrationsApplied: 0,
      checks: [],
    })).toMatchObject({
      verified: false,
      failures: [
        'deployment evidence is incomplete',
        'release approval is missing',
        'migration baseline is missing',
        'verification checks are missing',
      ],
    })
  })
})

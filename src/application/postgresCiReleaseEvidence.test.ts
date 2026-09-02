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
    })
  })

  it('fails CI verification when release approval is missing', () => {
    expect(verifyPostgresCiReleaseEvidence({
      ...audit,
      releaseApproved: false,
    })).toMatchObject({
      verified: false,
      summary: 'postgres release evidence verification failed',
    })
  })
})

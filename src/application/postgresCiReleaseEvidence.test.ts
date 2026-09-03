import { describe, expect, it } from 'vitest'
import { assertPostgresCiReleaseEvidence, verifyPostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'

describe('PostgreSQL CI release evidence', () => {
  const audit = {
    event: 'postgres-release-verification' as const,
    releaseId: 'release-1',
    createdAt: '2026-09-03T00:00:00.000Z',
    environment: 'production' as const,
    evidenceReady: true,
    releaseApproved: true,
    migrationsApplied: 2,
    checks: ['preflight passed'],
  }

  it('verifies complete release evidence for CI', () => {
    expect(verifyPostgresCiReleaseEvidence(audit)).toMatchObject({ verified: true, failures: [] })
  })

  it('requires release identity and a valid timestamp', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, releaseId: '', createdAt: 'invalid' }).failures).toEqual([
      'release identity is missing',
      'release timestamp is invalid',
    ])
  })

  it('reports the exact failed CI gates', () => {
    expect(verifyPostgresCiReleaseEvidence({
      ...audit,
      evidenceReady: false,
      releaseApproved: false,
      migrationsApplied: 0,
      checks: [],
    }).failures).toEqual([
      'deployment evidence is incomplete',
      'release approval is missing',
      'migration baseline is below the expected level',
      'verification checks are missing',
    ])
  })

  it('enforces an explicit expected migration baseline', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3)).toMatchObject({
      verified: false,
      failures: ['migration baseline is below the expected level'],
    })
  })

  it('rejects an invalid expected migration baseline', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 0)).toMatchObject({
      verified: false,
      failures: ['expected migration baseline is invalid'],
    })
  })

  it('throws actionable diagnostics when evidence is not releasable', () => {
    expect(() => assertPostgresCiReleaseEvidence({ ...audit, migrationsApplied: 0 })).toThrow('migration baseline is below the expected level')
  })
})

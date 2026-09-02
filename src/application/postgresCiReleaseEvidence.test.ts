import { describe, expect, it } from 'vitest'
import { assertPostgresCiReleaseEvidence, verifyPostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'

describe('PostgreSQL CI release evidence', () => {
  const audit = { event: 'postgres-release-verification' as const, environment: 'production' as const, evidenceReady: true, releaseApproved: true, migrationsApplied: 2, checks: ['preflight passed'] }
  it('verifies complete release evidence for CI', () => expect(verifyPostgresCiReleaseEvidence(audit)).toMatchObject({ verified: true, failures: [] }))
  it('reports the exact failed CI gates', () => expect(verifyPostgresCiReleaseEvidence({ ...audit, evidenceReady: false, releaseApproved: false, migrationsApplied: 0, checks: [] }).failures).toEqual(['deployment evidence is incomplete', 'release approval is missing', 'migration baseline is missing', 'verification checks are missing']))
  it('throws actionable diagnostics when evidence is not releasable', () => expect(() => assertPostgresCiReleaseEvidence({ ...audit, migrationsApplied: 0 })).toThrow('migration baseline is missing'))
})

import { describe, expect, it } from 'vitest'
import { assertPostgresCiReleaseEvidence, createPostgresReleaseEvidenceFingerprint, verifyPostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'

describe('PostgreSQL CI release evidence', () => {
  const audit = {
    event: 'postgres-release-verification' as const,
    releaseId: 'release-1',
    createdAt: '2026-09-03T00:00:00.000Z',
    environment: 'production' as const,
    evidenceReady: true,
    releaseApproved: true,
    migrationsApplied: 3,
    expectedMigrationBaseline: 3,
    releaseCommitSha: '84a95cf',
    checks: ['preflight passed'],
  }

  it('verifies complete release evidence using the audit baseline', () => {
    expect(verifyPostgresCiReleaseEvidence(audit)).toMatchObject({ verified: true, failures: [] })
  })

  it('preserves legacy non-production evidence with the default baseline', () => {
    const { expectedMigrationBaseline: _baseline, releaseCommitSha: _sha, ...legacyAudit } = {
      ...audit, environment: 'test' as const,
    }
    expect(verifyPostgresCiReleaseEvidence(legacyAudit)).toMatchObject({ verified: true, failures: [] })
  })

  it('creates a canonical SHA-256 evidence fingerprint', () => {
    expect(createPostgresReleaseEvidenceFingerprint(audit)).toMatch(/^[0-9a-f]{64}$/)
    expect(createPostgresReleaseEvidenceFingerprint(audit)).toBe(createPostgresReleaseEvidenceFingerprint({ ...audit }))
  })

  it('canonicalizes check order and Unicode before hashing evidence', () => {
    const reordered = { ...audit, checks: ['β', 'é'] }
    const decomposed = { ...audit, checks: ['e\u0301', 'β'] }
    const composed = { ...audit, checks: ['é', 'β'] }
    expect(createPostgresReleaseEvidenceFingerprint(reordered)).toBe(createPostgresReleaseEvidenceFingerprint({ ...reordered, checks: ['é', 'β'] }))
    expect(createPostgresReleaseEvidenceFingerprint(decomposed)).toBe(createPostgresReleaseEvidenceFingerprint(composed))
  })

  it('fails closed when an expected evidence fingerprint is malformed', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', evidenceFingerprint: 'wrong' }).failures)
      .toContain('release evidence fingerprint is invalid')
  })

  it('fails closed when an expected evidence fingerprint does not match', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', evidenceFingerprint: '0'.repeat(64) }).failures)
      .toContain('release evidence fingerprint does not match expected evidence')
  })

  it('canonicalizes audit and expected commit identities consistently', () => {
    const spacedUppercase = { ...audit, releaseCommitSha: '  84A95CF  ' }
    expect(verifyPostgresCiReleaseEvidence(spacedUppercase, 3, { releaseId: 'release-1', releaseCommitSha: '84a95cf' })).toMatchObject({ verified: true })
    expect(createPostgresReleaseEvidenceFingerprint(spacedUppercase)).toBe(createPostgresReleaseEvidenceFingerprint(audit))
  })

  it('canonicalizes audit and expected release identities consistently', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, releaseId: '  release-1  ' }, 3, { releaseId: 'release-1' })).toMatchObject({ verified: true })
    expect(createPostgresReleaseEvidenceFingerprint({ ...audit, releaseId: '  release-1  ' }))
      .toBe(createPostgresReleaseEvidenceFingerprint(audit))
  })

  it('canonicalizes expected release identity before binding evidence', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: '  release-1  ' })).toMatchObject({ verified: true })
  })

  it('fails closed on invalid expected release identity contracts', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: '   ' }).failures)
      .toContain('expected release identity is invalid')
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1\nprod' }).failures)
      .toContain('expected release identity contains control characters')
  })

  it('fails closed on an invalid expected release commit contract', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', releaseCommitSha: 'bad!' }).failures)
      .toContain('expected release commit identity is invalid')
  })

  it('fails closed when audit identity is not bound to the expected release', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-2', releaseCommitSha: '84a95cf' }).failures)
      .toContain('release evidence identity does not match expected release')
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', releaseCommitSha: 'aaaaaaa' }).failures)
      .toContain('release evidence commit does not match expected release')
  })

  it('rejects mismatched explicit and audited baselines', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 2).failures).toEqual([
      'release evidence baseline does not match audit baseline',
    ])
  })

  it('rejects audit timestamps too far in the future', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, createdAt: '2099-01-01T00:00:00.000Z' }).failures)
      .toContain('release timestamp is too far in the future')
  })

  it('fails closed when the injected verification clock is invalid', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1' }, Number.NaN).failures)
      .toContain('verification clock is invalid')
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1' }, -1).failures)
      .toContain('verification clock is invalid')
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1' }, Number.MAX_SAFE_INTEGER + 1).failures)
      .toContain('verification clock is invalid')
  })

  it('allows evidence timestamps within the bounded future clock skew', () => {
    const now = Date.parse('2026-09-03T00:00:00.000Z')
    expect(verifyPostgresCiReleaseEvidence({ ...audit, createdAt: '2026-09-03T00:05:00.000Z' }, 3, { releaseId: 'release-1' }, now).failures)
      .not.toContain('release timestamp is too far in the future')
  })

  it('accepts evidence exactly at the required freshness boundary', () => {
    const now = Date.parse('2026-09-03T00:00:00.001Z')
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', maxEvidenceAgeMs: 1 }, now))
      .toMatchObject({ verified: true })
  })

  it('evaluates evidence freshness against an injected deterministic clock', () => {
    const now = Date.parse('2026-09-03T00:00:00.002Z')
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', maxEvidenceAgeMs: 1 }, now).failures)
      .toContain('release evidence is stale')
  })

  it('fails closed on stale release evidence when a freshness window is required', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', maxEvidenceAgeMs: 1 }).failures)
      .toContain('release evidence is stale')
  })

  it('rejects unsafe or unbounded release evidence freshness windows', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', maxEvidenceAgeMs: Number.MAX_SAFE_INTEGER }).failures)
      .toContain('release evidence freshness window is invalid')
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', maxEvidenceAgeMs: 365 * 24 * 60 * 60 * 1000 + 1 }).failures)
      .toContain('release evidence freshness window is invalid')
  })

  it('rejects an invalid release evidence freshness window', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 3, { releaseId: 'release-1', maxEvidenceAgeMs: -1 }).failures)
      .toContain('release evidence freshness window is invalid')
  })

  it('canonicalizes equivalent timestamps before fingerprinting evidence', () => {
    const offsetTimestamp = { ...audit, createdAt: '2026-09-03T07:00:00.000+07:00' }
    expect(createPostgresReleaseEvidenceFingerprint(offsetTimestamp)).toBe(createPostgresReleaseEvidenceFingerprint(audit))
    expect(verifyPostgresCiReleaseEvidence(offsetTimestamp).failures).toContain('release timestamp is not canonical')
  })

  it('rejects non-canonical timestamps to prevent ambiguous audit evidence', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, createdAt: '2026-09-03T00:00:00Z' }).failures)
      .toContain('release timestamp is not canonical')
  })

  it('requires release identity and a valid timestamp', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, releaseId: '', createdAt: 'invalid' }).failures).toEqual([
      'release identity is missing',
      'release timestamp is invalid',
    ])
  })

  it('rejects control characters in release identity and verification checks', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, releaseId: 'release-1\nprod' }).failures)
      .toContain('release identity contains control characters')
    expect(verifyPostgresCiReleaseEvidence({ ...audit, checks: ['preflight\tpassed'] }).failures)
      .toContain('verification checks contain control characters')
  })

  it('rejects invalid applied migration counts', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, migrationsApplied: Number.NaN }).failures)
      .toContain('applied migration count is invalid')
    expect(verifyPostgresCiReleaseEvidence({ ...audit, migrationsApplied: 1.5 }).failures)
      .toContain('applied migration count is invalid')
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

  it('rejects duplicate verification checks after canonicalization', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, checks: ['é', 'e\u0301'] }).failures)
      .toContain('verification checks contain duplicate entries')
  })

  it('rejects verification checks that become empty after canonicalization', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, checks: ['preflight passed', '\u00a0'] }).failures)
      .toContain('verification checks contain an empty entry')
  })

  it('rejects empty or duplicate verification checks', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, checks: ['preflight passed', ''] }).failures)
      .toContain('verification checks contain an empty entry')
    expect(verifyPostgresCiReleaseEvidence({ ...audit, checks: ['preflight passed', 'preflight passed'] }).failures)
      .toContain('verification checks contain duplicate entries')
  })

  it('rejects an invalid expected migration baseline', () => {
    expect(verifyPostgresCiReleaseEvidence(audit, 0)).toMatchObject({
      verified: false,
      failures: ['expected migration baseline is invalid', 'release evidence baseline does not match audit baseline'],
    })
  })

  it('requires a production commit identity', () => {
    expect(verifyPostgresCiReleaseEvidence({ ...audit, releaseCommitSha: undefined }).failures)
      .toContain('release commit identity is invalid')
  })

  it('throws actionable diagnostics when evidence is not releasable', () => {
    expect(() => assertPostgresCiReleaseEvidence({ ...audit, migrationsApplied: 0 })).toThrow('migration baseline is below the expected level')
  })
})

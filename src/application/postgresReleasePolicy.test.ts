import { describe, expect, it } from 'vitest'
import { evaluatePostgresReleasePolicy } from './postgresReleasePolicy'

const productionRelease = {
  environment: 'production' as const,
  evidenceReady: true,
  deploymentPreflightReady: true,
  deploymentVerificationReady: true,
  migrationsApplied: 3,
  migrationBaselineVerified: true,
  releaseId: 'release-1',
  releaseTimestamp: '2026-09-03T00:00:00.000Z',
  releaseCommitSha: '84a95cf',
  verificationChecks: ['database reachable'],
}

describe('PostgreSQL release policy', () => {
  it('allows a complete production release', () => expect(evaluatePostgresReleasePolicy(productionRelease)).toEqual({ releasable: true, reasons: [] }))
  it('blocks incomplete deployment evidence', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, evidenceReady: false }).releasable).toBe(false))
  it('blocks failed production deployment preflight', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, deploymentPreflightReady: false }).reasons).toContain('production deployment preflight failed'))
  it('blocks failed production deployment verification', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, deploymentVerificationReady: false }).reasons).toContain('production deployment verification failed'))
  it('blocks invalid production migration counts', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationsApplied: 0 }).releasable).toBe(false)
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationsApplied: Number.NaN }).releasable).toBe(false)
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationsApplied: 1.5 }).releasable).toBe(false)
  })
  it('blocks invalid expected migration baseline', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, expectedMigrationBaseline: 1.5 }).releasable).toBe(false))
  it('blocks production releases below baseline', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationsApplied: 2, expectedMigrationBaseline: 3 }).releasable).toBe(false))
  it('blocks explicit baseline verification failure', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationBaselineVerified: false }).releasable).toBe(false))
  it('blocks missing or unsafe release identity', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseId: ' ' }).releasable).toBe(false)
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseId: 'release\n1' }).reasons).toContain('production release identity contains control characters')
  })
  it('blocks invalid release timestamp', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseTimestamp: 'invalid' }).releasable).toBe(false))
  it('blocks malformed production commit identity', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseCommitSha: 'release-1' }).releasable).toBe(false))
  it('blocks empty or unsafe production verification checks', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, verificationChecks: [] }).reasons).toContain('production release verification checks are missing')
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, verificationChecks: [' '] }).reasons).toContain('production release verification checks are missing')
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, verificationChecks: ['passed\nspoofed'] }).reasons).toContain('production release verification checks contain control characters')
  })
  it('blocks readiness latency above the production threshold', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, readinessLatencyMs: 250, maxReadinessLatencyMs: 200 }).reasons).toContain('production readiness latency exceeds the allowed threshold'))
  it('blocks invalid production readiness latency metadata', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, readinessLatencyMs: -1 }).reasons).toContain('production readiness latency is invalid')
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, maxReadinessLatencyMs: 0 }).reasons).toContain('production readiness latency threshold is invalid')
  })
  it('blocks stale readiness evidence', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, readinessCheckedAt: '2026-09-03T00:00:00.000Z', maxReadinessAgeMs: 60_000, now: '2026-09-03T00:02:00.000Z' }).reasons).toContain('production readiness evidence is stale')
  })
  it('blocks future readiness evidence timestamps', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, readinessCheckedAt: '2026-09-03T00:02:00.000Z', maxReadinessAgeMs: 60_000, now: '2026-09-03T00:00:00.000Z' }).reasons).toContain('production readiness evidence timestamp is in the future')
  })
  it('blocks readiness evidence that predates the release', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, readinessCheckedAt: '2026-09-02T23:59:59.999Z' }).reasons).toContain('production readiness evidence predates the release')
  })
  it('accepts readiness evidence collected after the release', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, readinessCheckedAt: '2026-09-03T00:00:01.000Z' })).toEqual({ releasable: true, reasons: [] })
  })
  it('blocks invalid readiness freshness metadata', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, maxReadinessAgeMs: 0 }).reasons).toContain('production readiness freshness threshold is invalid')
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, readinessCheckedAt: 'invalid' }).reasons).toContain('production readiness timestamp is invalid')
  })
})

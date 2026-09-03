import { describe, expect, it } from 'vitest'
import { evaluatePostgresReleasePolicy } from './postgresReleasePolicy'

const productionRelease = {
  environment: 'production' as const,
  evidenceReady: true,
  deploymentPreflightReady: true,
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
  it('blocks missing production migration baseline', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationsApplied: 0 }).reasons).toContain('production release requires an established migration baseline'))
  it('blocks invalid expected migration baseline', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, expectedMigrationBaseline: 1.5 }).releasable).toBe(false))
  it('blocks production releases below baseline', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationsApplied: 2, expectedMigrationBaseline: 3 }).releasable).toBe(false))
  it('blocks explicit baseline verification failure', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationBaselineVerified: false }).releasable).toBe(false))
  it('blocks missing release identity', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseId: ' ' }).releasable).toBe(false))
  it('blocks invalid release timestamp', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseTimestamp: 'invalid' }).releasable).toBe(false))
  it('blocks missing or malformed production commit identity', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseCommitSha: '' }).reasons).toContain('production release commit identity is invalid')
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseCommitSha: 'release-1' }).releasable).toBe(false)
  })
  it('blocks explicit empty production verification checks', () => expect(evaluatePostgresReleasePolicy({ ...productionRelease, verificationChecks: [] }).reasons).toContain('production release verification checks are missing'))
})

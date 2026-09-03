import { describe, expect, it } from 'vitest'
import { evaluatePostgresReleasePolicy } from './postgresReleasePolicy'

const productionRelease = {
  environment: 'production' as const,
  evidenceReady: true,
  migrationsApplied: 3,
  migrationBaselineVerified: true,
  releaseId: 'release-1',
  releaseTimestamp: '2026-09-03T00:00:00.000Z',
}

describe('PostgreSQL release policy', () => {
  it('allows production release with complete evidence and migration baseline', () => {
    expect(evaluatePostgresReleasePolicy(productionRelease)).toEqual({ releasable: true, reasons: [] })
  })

  it('blocks release when deployment evidence is incomplete', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, evidenceReady: false })).toEqual({
      releasable: false,
      reasons: ['deployment evidence is incomplete'],
    })
  })

  it('blocks production release without a migration baseline', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, migrationsApplied: 0 })).toEqual({
      releasable: false,
      reasons: ['production release requires an established migration baseline'],
    })
  })

  it('blocks production release below an explicit expected migration baseline', () => {
    expect(evaluatePostgresReleasePolicy({
      ...productionRelease,
      migrationsApplied: 2,
      expectedMigrationBaseline: 3,
    })).toEqual({
      releasable: false,
      reasons: ['production release migration baseline is below the expected level'],
    })
  })

  it('blocks production release when baseline verification explicitly fails', () => {
    expect(evaluatePostgresReleasePolicy({
      ...productionRelease,
      migrationBaselineVerified: false,
    })).toEqual({
      releasable: false,
      reasons: ['production release migration baseline verification failed'],
    })
  })

  it('blocks production release without release identity', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseId: ' ' })).toEqual({
      releasable: false,
      reasons: ['production release identity is missing'],
    })
  })

  it('blocks production release with an invalid release timestamp', () => {
    expect(evaluatePostgresReleasePolicy({ ...productionRelease, releaseTimestamp: 'invalid' })).toEqual({
      releasable: false,
      reasons: ['production release timestamp is invalid'],
    })
  })
})

import { describe, expect, it } from 'vitest'
import { evaluatePostgresReleasePolicy } from './postgresReleasePolicy'

describe('PostgreSQL release policy', () => {
  it('allows production release with complete evidence and migration baseline', () => {
    expect(evaluatePostgresReleasePolicy({
      environment: 'production',
      evidenceReady: true,
      migrationsApplied: 3,
    })).toEqual({ releasable: true, reasons: [] })
  })

  it('blocks release when deployment evidence is incomplete', () => {
    expect(evaluatePostgresReleasePolicy({
      environment: 'production',
      evidenceReady: false,
      migrationsApplied: 3,
    })).toEqual({
      releasable: false,
      reasons: ['deployment evidence is incomplete'],
    })
  })

  it('blocks production release without a migration baseline', () => {
    expect(evaluatePostgresReleasePolicy({
      environment: 'production',
      evidenceReady: true,
      migrationsApplied: 0,
    })).toEqual({
      releasable: false,
      reasons: ['production release requires an established migration baseline'],
    })
  })

  it('blocks production release below an explicit expected migration baseline', () => {
    expect(evaluatePostgresReleasePolicy({
      environment: 'production',
      evidenceReady: true,
      migrationsApplied: 2,
      expectedMigrationBaseline: 3,
    })).toEqual({
      releasable: false,
      reasons: ['production release migration baseline is below the expected level'],
    })
  })
})

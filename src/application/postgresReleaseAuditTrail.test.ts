import { describe, expect, it } from 'vitest'
import { createPostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'

describe('PostgreSQL release audit trail', () => {
  it('creates reproducible production release evidence', () => {
    expect(createPostgresReleaseAuditRecord({
      environment: 'production',
      evidenceReady: true,
      releaseApproved: true,
      migrationsApplied: 3,
      checks: ['preflight passed', 'recovery passed'],
    })).toEqual({
      event: 'postgres-release-verification',
      environment: 'production',
      evidenceReady: true,
      releaseApproved: true,
      migrationsApplied: 3,
      checks: ['preflight passed', 'recovery passed'],
    })
  })

  it('preserves failed release decisions for audit evidence', () => {
    expect(createPostgresReleaseAuditRecord({
      environment: 'production',
      evidenceReady: false,
      releaseApproved: false,
      migrationsApplied: 0,
      checks: ['deployment evidence is incomplete'],
    }).releaseApproved).toBe(false)
  })
})

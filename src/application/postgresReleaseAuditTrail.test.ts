import { describe, expect, it } from 'vitest'
import { createPostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'

describe('PostgreSQL release audit trail', () => {
  it('records immutable release identity and timestamp metadata', () => {
    const audit = createPostgresReleaseAuditRecord({
      environment: 'production',
      evidenceReady: true,
      releaseApproved: true,
      migrationsApplied: 3,
      expectedMigrationBaseline: 3,
      releaseCommitSha: '84a95cf',
      checks: ['preflight passed'],
      releaseId: 'release-2026-09-03',
      createdAt: '2026-09-03T00:00:00.000Z',
    })

    expect(audit).toEqual({
      event: 'postgres-release-verification',
      releaseId: 'release-2026-09-03',
      createdAt: '2026-09-03T00:00:00.000Z',
      environment: 'production',
      evidenceReady: true,
      releaseApproved: true,
      migrationsApplied: 3,
      expectedMigrationBaseline: 3,
      releaseCommitSha: '84a95cf',
      checks: ['preflight passed'],
    })
  })

  it('freezes the audit record and its verification checks', () => {
    const audit = createPostgresReleaseAuditRecord({
      environment: 'production',
      evidenceReady: true,
      releaseApproved: true,
      migrationsApplied: 1,
      checks: ['verification passed'],
    })

    expect(Object.isFrozen(audit)).toBe(true)
    expect(Object.isFrozen(audit.checks)).toBe(true)
    expect(() => (audit.checks as string[]).push('tampered')).toThrow()
  })

  it('preserves legacy audit shape when baseline is absent', () => {
    const audit = createPostgresReleaseAuditRecord({
      environment: 'test',
      evidenceReady: true,
      releaseApproved: true,
      migrationsApplied: 1,
      checks: ['verification passed'],
    })

    expect(audit).not.toHaveProperty('expectedMigrationBaseline')
    expect(audit.releaseId).toBe('local')
    expect(Number.isNaN(Date.parse(audit.createdAt!))).toBe(false)
  })
})

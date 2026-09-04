import { describe, expect, it } from 'vitest'
import { createPostgresDeploymentEvidence } from './postgresDeploymentEvidence'

describe('PostgreSQL deployment evidence', () => {
  it('collects successful deployment and recovery evidence', () => {
    expect(createPostgresDeploymentEvidence({
      migrationsApplied: 2,
      preflightChecks: ['database configuration valid'],
      recoveryChecks: ['migration history readable'],
      postRestoreChecks: ['migration history meets recovery baseline'],
    })).toEqual({
      ready: true,
      migrationsApplied: 2,
      checks: [
        'database configuration valid',
        'migration history readable',
        'migration history meets recovery baseline',
      ],
    })
  })

  it('rejects incomplete evidence when a required check category is empty', () => {
    expect(createPostgresDeploymentEvidence({
      migrationsApplied: 2,
      preflightChecks: ['database configuration valid'],
      recoveryChecks: [],
      postRestoreChecks: ['migration history meets recovery baseline'],
    }).ready).toBe(false)
  })

  it('rejects invalid migration counts', () => {
    expect(createPostgresDeploymentEvidence({
      migrationsApplied: 0,
      preflightChecks: ['preflight'],
      recoveryChecks: ['recovery'],
      postRestoreChecks: ['post-restore'],
    }).ready).toBe(false)
  })

  it('rejects blank or control-character checks', () => {
    expect(createPostgresDeploymentEvidence({
      migrationsApplied: 2,
      preflightChecks: ['  '],
      recoveryChecks: ['recovery'],
      postRestoreChecks: ['post-restore'],
    }).ready).toBe(false)

    expect(createPostgresDeploymentEvidence({
      migrationsApplied: 2,
      preflightChecks: ['preflight\nforged'],
      recoveryChecks: ['recovery'],
      postRestoreChecks: ['post-restore'],
    }).ready).toBe(false)
  })

  it('normalizes check labels before returning audit evidence', () => {
    expect(createPostgresDeploymentEvidence({
      migrationsApplied: 2,
      preflightChecks: ['  preflight  '],
      recoveryChecks: [' recovery '],
      postRestoreChecks: [' post-restore '],
    }).checks).toEqual(['preflight', 'recovery', 'post-restore'])
  })
})

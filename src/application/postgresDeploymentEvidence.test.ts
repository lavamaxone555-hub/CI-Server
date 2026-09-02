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

  it('does not mark a release ready without applied migrations', () => {
    expect(createPostgresDeploymentEvidence({
      migrationsApplied: 0,
      preflightChecks: ['database configuration valid'],
      recoveryChecks: ['migration history readable'],
      postRestoreChecks: ['migration history meets recovery baseline'],
    }).ready).toBe(false)
  })
})

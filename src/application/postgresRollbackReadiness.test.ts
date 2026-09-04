import { describe, expect, it } from 'vitest'
import { verifyPostgresRollbackReadiness } from './postgresRollbackReadiness'

describe('PostgreSQL rollback readiness', () => {
  it('requires explicit rollback verification evidence', () => {
    expect(verifyPostgresRollbackReadiness().ready).toBe(false)
  })
  it('accepts explicit rollback verification checks', () => {
    expect(verifyPostgresRollbackReadiness({ rollbackChecks: ['rollback procedure verified'] }).ready).toBe(true)
  })
  it('rejects unsafe, empty, or duplicate rollback evidence', () => {
    expect(verifyPostgresRollbackReadiness({ rollbackChecks: [' ', 'verified\nspoofed', 'safe', 'safe'] }).ready).toBe(false)
  })
})
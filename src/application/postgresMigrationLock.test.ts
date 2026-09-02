import { describe, expect, it } from 'vitest'
import { POSTGRES_MIGRATION_LOCK_ID, withPostgresMigrationLock } from './postgresMigrationLock'

describe('PostgreSQL migration lock', () => {
  it('acquires and releases the advisory lock around migration work', async () => {
    const statements: string[] = []
    const pool = { query: async (sql: string) => { statements.push(sql) }, end: async () => {} }
    const result = await withPostgresMigrationLock(pool, async () => 'done')
    expect(result).toBe('done')
    expect(statements).toEqual([
      `SELECT pg_advisory_lock(${POSTGRES_MIGRATION_LOCK_ID})`,
      `SELECT pg_advisory_unlock(${POSTGRES_MIGRATION_LOCK_ID})`,
    ])
  })

  it('releases the advisory lock when migration work fails', async () => {
    const statements: string[] = []
    const pool = { query: async (sql: string) => { statements.push(sql) }, end: async () => {} }
    await expect(withPostgresMigrationLock(pool, async () => { throw new Error('failed') }))
      .rejects.toThrow('failed')
    expect(statements).toHaveLength(2)
  })
})

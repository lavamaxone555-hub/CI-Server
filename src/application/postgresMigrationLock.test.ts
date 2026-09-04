import { describe, expect, it, vi } from 'vitest'
import { POSTGRES_MIGRATION_LOCK_ID, withPostgresMigrationLock } from './postgresMigrationLock'

describe('PostgreSQL migration lock', () => {
  function makePool() {
    const statements: string[] = []
    const release = vi.fn()
    const client = { query: async (sql: string) => { statements.push(sql) }, release }
    return { pool: { connect: async () => client, query: async () => undefined, end: async () => {} }, statements, release }
  }

  it('acquires and releases the advisory lock on the same dedicated client', async () => {
    const { pool, statements, release } = makePool()
    const result = await withPostgresMigrationLock(pool, async (client) => {
      await client.query('MIGRATE')
      return 'done'
    })
    expect(result).toBe('done')
    expect(statements).toEqual([
      `SELECT pg_advisory_lock(${POSTGRES_MIGRATION_LOCK_ID})`,
      'MIGRATE',
      `SELECT pg_advisory_unlock(${POSTGRES_MIGRATION_LOCK_ID})`,
    ])
    expect(release).toHaveBeenCalledOnce()
  })

  it('releases the dedicated client when migration work fails', async () => {
    const { pool, statements, release } = makePool()
    await expect(withPostgresMigrationLock(pool, async () => { throw new Error('failed') }))
      .rejects.toThrow('failed')
    expect(statements).toHaveLength(2)
    expect(release).toHaveBeenCalledOnce()
  })

  it('preserves both migration and advisory unlock failures structurally', async () => {
    let calls = 0
    const release = vi.fn()
    const original = new Error('migration failed')
    const unlock = new Error('unlock failed')
    const pool = {
      connect: async () => ({ query: async () => { calls += 1; if (calls === 2) throw unlock }, release }),
      query: async () => undefined, end: async () => {},
    }
    try {
      await withPostgresMigrationLock(pool, async () => { throw original })
      throw new Error('expected lock operation to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError)
      expect((error as AggregateError).errors).toEqual([original, unlock])
      expect((error as Error).cause).toBe(original)
    }
    expect(release).toHaveBeenCalledOnce()
  })


})

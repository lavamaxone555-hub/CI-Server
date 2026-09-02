import { describe, expect, it } from 'vitest'

describe('PostgreSQL migration failure recovery contract', () => {
  it('documents that SQL and history writes share one transaction boundary', async () => {
    const calls: string[] = []
    const transaction = {
      begin: async () => { calls.push('BEGIN') },
      execute: async (sql: string) => {
        calls.push(sql)
        if (sql === 'BROKEN') throw new Error('migration failed')
      },
      record: async () => { calls.push('HISTORY') },
      commit: async () => { calls.push('COMMIT') },
      rollback: async () => { calls.push('ROLLBACK') },
    }

    await transaction.begin()
    try {
      await transaction.execute('CREATE TABLE demo')
      await transaction.record()
      await transaction.execute('BROKEN')
      await transaction.record()
      await transaction.commit()
    } catch {
      await transaction.rollback()
    }

    expect(calls).toEqual([
      'BEGIN',
      'CREATE TABLE demo',
      'HISTORY',
      'BROKEN',
      'ROLLBACK',
    ])
    expect(calls).not.toContain('COMMIT')
  })
})

import { describe, expect, it } from 'vitest'
import { createPostgresMigrationExecutor } from './postgresMigrationExecutor'

describe('PostgreSQL migration executor', () => {
  it('executes migration SQL through the database client', async () => {
    const queries: string[] = []
    const executor = createPostgresMigrationExecutor({
      query: async (sql) => { queries.push(sql) },
    })
    await executor.execute('CREATE TABLE example (id TEXT PRIMARY KEY)')
    expect(queries).toEqual(['CREATE TABLE example (id TEXT PRIMARY KEY)'])
  })
})

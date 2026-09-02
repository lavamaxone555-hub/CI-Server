import { describe, expect, it } from 'vitest'
import { loadDatabaseConfig } from './databaseConfig'
import { verifyPostgresConnection } from './postgresDatabase'

describe('PostgreSQL production configuration', () => {
  it('supports a PostgreSQL connection string for the production pool', () => {
    const config = loadDatabaseConfig({ DATABASE_URL: 'postgresql://user:pass@localhost:5432/retail' })
    expect(config.connectionString).toMatch(/^postgresql:\/\//)
    expect(config.ssl).toBe(false)
  })

  it('verifies a live PostgreSQL connection through SELECT 1', async () => {
    const queries: string[] = []
    await verifyPostgresConnection({ query: async (sql) => { queries.push(sql) }, end: async () => undefined })
    expect(queries).toEqual(['SELECT 1'])
  })
})

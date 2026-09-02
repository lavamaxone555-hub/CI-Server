import { describe, expect, it } from 'vitest'
import { loadDatabaseConfig } from './databaseConfig'

describe('PostgreSQL production configuration', () => {
  it('supports a PostgreSQL connection string for the production pool', () => {
    const config = loadDatabaseConfig({ DATABASE_URL: 'postgresql://user:pass@localhost:5432/retail' })
    expect(config.connectionString).toMatch(/^postgresql:\/\//)
    expect(config.ssl).toBe(false)
  })
})

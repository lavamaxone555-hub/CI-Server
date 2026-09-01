import { describe, expect, it } from 'vitest'
import { loadDatabaseConfig } from './databaseConfig'

describe('database configuration', () => {
  it('loads DATABASE_URL and SSL settings', () => {
    expect(loadDatabaseConfig({ DATABASE_URL: 'postgres://localhost/retail', DATABASE_SSL: 'true' }))
      .toEqual({ connectionString: 'postgres://localhost/retail', ssl: true })
  })

  it('fails fast without DATABASE_URL', () => {
    expect(() => loadDatabaseConfig({})).toThrow('DATABASE_URL is required')
  })
})

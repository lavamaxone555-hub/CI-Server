import { describe, expect, it } from 'vitest'
import { loadDatabaseConfig } from './databaseConfig'

describe('database configuration', () => {
  it('loads DATABASE_URL and SSL settings', () => {
    expect(loadDatabaseConfig({ DATABASE_URL: 'postgres://localhost/retail', DATABASE_SSL: 'true' }))
      .toEqual({ connectionString: 'postgres://localhost/retail', ssl: true })
  })

  it('canonicalizes DATABASE_URL and DATABASE_SSL configuration', () => {
    expect(loadDatabaseConfig({ DATABASE_URL: '  POSTGRES://localhost/retail  ', DATABASE_SSL: '  TRUE  ' }))
      .toEqual({ connectionString: 'POSTGRES://localhost/retail', ssl: true })
  })

  it('rejects malformed or empty DATABASE_SSL configuration', () => {
    expect(() => loadDatabaseConfig({ DATABASE_URL: 'postgres://localhost/retail', DATABASE_SSL: 'yes' }))
      .toThrow('DATABASE_SSL must be true or false')
    expect(() => loadDatabaseConfig({ DATABASE_URL: 'postgres://localhost/retail', DATABASE_SSL: '   ' }))
      .toThrow('DATABASE_SSL must not be empty')
  })

  it('fails fast without DATABASE_URL', () => {
    expect(() => loadDatabaseConfig({})).toThrow('DATABASE_URL is required')
  })

  it('rejects PostgreSQL URLs missing a host or database name', () => {
    expect(() => loadDatabaseConfig({ DATABASE_URL: 'postgres:///retail' }))
      .toThrow('DATABASE_URL must include host and database name')
    expect(() => loadDatabaseConfig({ DATABASE_URL: 'postgres://localhost/' }))
      .toThrow('DATABASE_URL must include host and database name')
  })

  it('rejects malformed PostgreSQL connection strings', () => {
    expect(() => loadDatabaseConfig({ DATABASE_URL: 'postgres://[invalid' }))
      .toThrow('DATABASE_URL must be a valid PostgreSQL connection string')
  })

  it('rejects non-PostgreSQL connection strings', () => {
    expect(() => loadDatabaseConfig({ DATABASE_URL: 'mysql://localhost/retail' }))
      .toThrow('DATABASE_URL must be a PostgreSQL connection string')
  })
})

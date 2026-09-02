import { describe, expect, it } from 'vitest'
import { requirePostgresIntegrationUrl, shouldRunPostgresIntegration } from './postgresIntegrationEnvironment'

describe('PostgreSQL integration environment', () => {
  it('detects whether a real database is configured', () => {
    expect(shouldRunPostgresIntegration({})).toBe(false)
    expect(shouldRunPostgresIntegration({ DATABASE_URL: 'postgresql://localhost/retail_test' })).toBe(true)
  })

  it('requires DATABASE_URL before running real integration tests', () => {
    expect(() => requirePostgresIntegrationUrl({})).toThrow('DATABASE_URL is required for PostgreSQL integration tests')
    expect(requirePostgresIntegrationUrl({ DATABASE_URL: 'postgresql://localhost/retail_test' }))
      .toBe('postgresql://localhost/retail_test')
  })
})

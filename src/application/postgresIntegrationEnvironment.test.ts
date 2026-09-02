import { describe, expect, it } from 'vitest'
import {
  hasPostgresIntegrationEnvironment,
  loadPostgresIntegrationEnvironment,
} from './postgresIntegrationEnvironment'

describe('PostgreSQL integration environment', () => {
  it('detects a configured live integration database', () => {
    expect(hasPostgresIntegrationEnvironment({ POSTGRES_INTEGRATION_URL: 'postgresql://localhost/test' })).toBe(true)
  })

  it('does not run live integration tests without an explicit URL', () => {
    expect(hasPostgresIntegrationEnvironment({})).toBe(false)
  })

  it('maps the explicit integration URL to a test database configuration', () => {
    expect(loadPostgresIntegrationEnvironment({
      POSTGRES_INTEGRATION_URL: 'postgresql://localhost/test',
      POSTGRES_INTEGRATION_SSL: 'true',
    })).toEqual({
      DATABASE_URL: 'postgresql://localhost/test',
      DATABASE_SSL: 'true',
      NODE_ENV: 'test',
    })
  })

  it('fails clearly when live integration configuration is missing', () => {
    expect(() => loadPostgresIntegrationEnvironment({}))
      .toThrow('POSTGRES_INTEGRATION_URL is required for live integration tests')
  })
})

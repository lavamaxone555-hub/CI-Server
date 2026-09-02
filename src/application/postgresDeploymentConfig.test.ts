import { describe, expect, it } from 'vitest'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

describe('PostgreSQL deployment configuration', () => {
  it('loads development defaults', () => {
    expect(loadPostgresDeploymentConfig({ DATABASE_URL: 'postgresql://localhost/retail' }))
      .toMatchObject({ environment: 'development', ssl: false })
  })

  it('requires SSL in production', () => {
    expect(() => loadPostgresDeploymentConfig({ DATABASE_URL: 'postgresql://localhost/retail', NODE_ENV: 'production' }))
      .toThrow('DATABASE_SSL=true is required in production')
  })

  it('accepts production SSL configuration', () => {
    expect(loadPostgresDeploymentConfig({ DATABASE_URL: 'postgresql://localhost/retail', NODE_ENV: 'production', DATABASE_SSL: 'true' }))
      .toMatchObject({ environment: 'production', ssl: true })
  })
})

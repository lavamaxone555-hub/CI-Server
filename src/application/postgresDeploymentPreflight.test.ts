import { describe, expect, it } from 'vitest'
import { verifyPostgresDeploymentPreflight } from './postgresDeploymentPreflight'

const databaseUrl = 'postgresql://user:password@localhost:5432/app'

describe('PostgreSQL deployment preflight', () => {
  it('reports production safety checks', () => {
    expect(verifyPostgresDeploymentPreflight({
      NODE_ENV: 'production',
      DATABASE_URL: databaseUrl,
      DATABASE_SSL: 'true',
      DATABASE_MIGRATION_APPROVED: 'true',
    })).toEqual({
      ready: true,
      checks: [
        'database configuration valid',
        'production SSL enabled',
        'production migration explicitly approved',
      ],
      failures: [],
    })
  })

  it('fails through configuration validation before deployment', () => {
    expect(() => verifyPostgresDeploymentPreflight({
      NODE_ENV: 'production',
      DATABASE_URL: databaseUrl,
      DATABASE_SSL: 'true',
    })).toThrow('DATABASE_MIGRATION_APPROVED=true is required')
  })
})

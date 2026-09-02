import { describe, expect, it } from 'vitest'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

const databaseUrl = 'postgresql://user:password@localhost:5432/app'

describe('PostgreSQL deployment config', () => {
  it('requires SSL in production', () => {
    expect(() => loadPostgresDeploymentConfig({ NODE_ENV: 'production', DATABASE_URL: databaseUrl }))
      .toThrow('DATABASE_SSL=true is required in production')
  })

  it('requires explicit approval for production startup migrations', () => {
    expect(() => loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
    })).toThrow('DATABASE_MIGRATION_APPROVED=true is required for production startup migrations')
  })

  it('allows explicitly approved production startup migrations', () => {
    expect(loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATION_APPROVED: 'true',
    }).migrationOnStartup).toBe(true)
  })

  it('allows production deployments to disable startup migrations', () => {
    expect(loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATE_ON_STARTUP: 'false',
    }).migrationOnStartup).toBe(false)
  })
})

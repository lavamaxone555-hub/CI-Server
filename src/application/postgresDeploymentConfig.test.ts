import { describe, expect, it } from 'vitest'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

const databaseUrl = 'postgresql://user:password@localhost:5432/app'

describe('PostgreSQL deployment configuration', () => {
  it('requires explicit approval for production startup migrations', () => {
    expect(() => loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true', RELEASE_ID: 'release-1',
    })).toThrow('DATABASE_MIGRATION_APPROVED=true is required for production startup migrations')
  })

  it('allows explicitly approved production startup migrations', () => {
    expect(loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATION_APPROVED: 'true', RELEASE_ID: 'release-1',
    })).toMatchObject({ environment: 'production', migrationOnStartup: true, releaseId: 'release-1', expectedMigrationBaseline: 1 })
  })

  it('allows production deployments to disable startup migrations', () => {
    expect(loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATE_ON_STARTUP: 'false', RELEASE_ID: 'release-1',
    })).toMatchObject({ migrationOnStartup: false, releaseId: 'release-1' })
  })

  it('requires a real release identity in production', () => {
    expect(() => loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true', DATABASE_MIGRATE_ON_STARTUP: 'false',
    })).toThrow('RELEASE_ID is required in production')
  })

  it('supports an explicit production migration baseline', () => {
    expect(loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATE_ON_STARTUP: 'false', RELEASE_ID: 'release-1',
      DATABASE_EXPECTED_MIGRATION_BASELINE: '3',
    }).expectedMigrationBaseline).toBe(3)
  })

  it('rejects invalid expected migration baselines', () => {
    expect(() => loadPostgresDeploymentConfig({
      NODE_ENV: 'production', DATABASE_URL: databaseUrl, DATABASE_SSL: 'true',
      DATABASE_MIGRATE_ON_STARTUP: 'false', RELEASE_ID: 'release-1',
      DATABASE_EXPECTED_MIGRATION_BASELINE: '1.5',
    })).toThrow('DATABASE_EXPECTED_MIGRATION_BASELINE must be a positive integer')
  })
})

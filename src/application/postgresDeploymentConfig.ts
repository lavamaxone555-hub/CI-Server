import { loadDatabaseConfig, type DatabaseConfig } from './databaseConfig'

export interface PostgresDeploymentConfig extends DatabaseConfig {
  environment: 'development' | 'test' | 'production'
  migrationOnStartup: boolean
}

export function loadPostgresDeploymentConfig(
  env: Record<string, string | undefined> = process.env,
): PostgresDeploymentConfig {
  const database = loadDatabaseConfig(env)
  const environment = env.NODE_ENV ?? 'development'
  if (environment !== 'development' && environment !== 'test' && environment !== 'production') {
    throw new Error('NODE_ENV must be development, test, or production')
  }
  if (environment === 'production' && !database.ssl) {
    throw new Error('DATABASE_SSL=true is required in production')
  }
  const migrationOnStartup = env.DATABASE_MIGRATE_ON_STARTUP !== 'false'
  if (environment === 'production' && migrationOnStartup && env.DATABASE_MIGRATION_APPROVED !== 'true') {
    throw new Error('DATABASE_MIGRATION_APPROVED=true is required for production startup migrations')
  }
  return { ...database, environment, migrationOnStartup }
}

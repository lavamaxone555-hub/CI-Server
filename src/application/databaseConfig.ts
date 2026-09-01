export interface DatabaseConfig {
  connectionString: string
  ssl: boolean
}

export function loadDatabaseConfig(env: Record<string, string | undefined> = process.env): DatabaseConfig {
  const connectionString = env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required')
  return {
    connectionString,
    ssl: env.DATABASE_SSL === 'true',
  }
}

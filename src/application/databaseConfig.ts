export interface DatabaseConfig {
  connectionString: string
  ssl: boolean
}

export function loadDatabaseConfig(env: Record<string, string | undefined> = process.env): DatabaseConfig {
  const connectionString = env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required')
  if (!/^postgres(?:ql)?:\/\//.test(connectionString)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string')
  }
  return {
    connectionString,
    ssl: env.DATABASE_SSL === 'true',
  }
}

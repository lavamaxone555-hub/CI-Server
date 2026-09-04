export interface DatabaseConfig {
  connectionString: string
  ssl: boolean
}

export function loadDatabaseConfig(env: Record<string, string | undefined> = process.env): DatabaseConfig {
  const connectionString = env.DATABASE_URL?.normalize('NFC').trim()
  if (!connectionString) throw new Error('DATABASE_URL is required')
  let parsedUrl: URL
  try {
    parsedUrl = new URL(connectionString)
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
  }
  if (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string')
  }
  if (!parsedUrl.hostname || !parsedUrl.pathname || parsedUrl.pathname === '/') {
    throw new Error('DATABASE_URL must include host and database name')
  }
  const rawSsl = env.DATABASE_SSL?.normalize('NFC').trim().toLowerCase()
  if (rawSsl === '') throw new Error('DATABASE_SSL must not be empty')
  if (rawSsl !== undefined && rawSsl !== 'true' && rawSsl !== 'false') {
    throw new Error('DATABASE_SSL must be true or false')
  }
  return {
    connectionString,
    ssl: rawSsl === 'true',
  }
}

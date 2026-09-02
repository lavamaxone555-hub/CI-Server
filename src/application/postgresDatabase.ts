import { Pool } from 'pg'
import { loadDatabaseConfig } from './databaseConfig'

export interface PostgresPool {
  query(sql: string, parameters?: unknown[]): Promise<unknown>
  end(): Promise<void>
}

export function createPostgresPool(env: Record<string, string | undefined> = process.env): PostgresPool {
  const config = loadDatabaseConfig(env)
  return new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
  })
}

export async function verifyPostgresConnection(pool: PostgresPool): Promise<void> {
  await pool.query('SELECT 1')
}

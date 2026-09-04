import { Pool } from 'pg'
import { loadDatabaseConfig } from './databaseConfig'

export interface PostgresQueryClient {
  query(sql: string, parameters?: unknown[]): Promise<unknown>
}

export interface PostgresClient extends PostgresQueryClient {
  release(): void
}

export interface PostgresPool extends PostgresQueryClient {
  end(): Promise<void>
}

export interface PostgresPoolWithClient extends PostgresPool {
  connect(): Promise<PostgresClient>
}

export function createPostgresPool(env: NodeJS.ProcessEnv): PostgresPoolWithClient {
  const config = loadDatabaseConfig(env)
  return new Pool(config)
}

export async function verifyPostgresConnection(pool: PostgresPool): Promise<void> {
  await pool.query('SELECT 1')
}

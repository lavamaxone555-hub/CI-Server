import type { TransactionalMigrationExecutor } from './migrationRunner'

export interface PostgresQueryClient {
  query(sql: string): Promise<unknown>
}

export function createPostgresMigrationExecutor(client: PostgresQueryClient): TransactionalMigrationExecutor {
  return {
    begin: async () => { await client.query('BEGIN') },
    execute: async (sql) => { await client.query(sql) },
    commit: async () => { await client.query('COMMIT') },
    rollback: async () => { await client.query('ROLLBACK') },
  }
}

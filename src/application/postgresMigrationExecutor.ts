import type { TransactionalMigrationExecutor } from './migrationRunner'

export interface PostgresQueryClient {
  query(sql: string): Promise<unknown>
}

function normalizeTransactionFailure(error: unknown): Error {
  return error instanceof Error ? error : new Error('database transaction operation failed')
}

export function createPostgresMigrationExecutor(client: PostgresQueryClient): TransactionalMigrationExecutor {
  return {
    begin: async () => { await client.query('BEGIN') },
    execute: async (sql) => { await client.query(sql) },
    commit: async () => { await client.query('COMMIT') },
    rollback: async () => {
      try {
        await client.query('ROLLBACK')
      } catch (error) {
        throw normalizeTransactionFailure(error)
      }
    },
  }
}

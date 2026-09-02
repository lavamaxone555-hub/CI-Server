import type { MigrationExecutor } from './migrationRunner'

export interface PostgresQueryClient {
  query(sql: string): Promise<unknown>
}

export function createPostgresMigrationExecutor(client: PostgresQueryClient): MigrationExecutor {
  return {
    execute: async (sql) => {
      await client.query(sql)
    },
  }
}

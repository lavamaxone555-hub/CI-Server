import type { PostgresClient, PostgresPoolWithClient } from './postgresDatabase'

export const POSTGRES_MIGRATION_LOCK_ID = 73910421

export async function withPostgresMigrationLock<T>(
  pool: PostgresPoolWithClient,
  operation: (client: PostgresClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  let result!: T
  let operationError: unknown
  let lockAcquired = false
  try {
    await client.query(`SELECT pg_advisory_lock(${POSTGRES_MIGRATION_LOCK_ID})`)
    lockAcquired = true
    try {
      result = await operation(client)
    } catch (error) {
      operationError = error
    }

    if (lockAcquired) {
      try {
        await client.query(`SELECT pg_advisory_unlock(${POSTGRES_MIGRATION_LOCK_ID})`)
      } catch (unlockError) {
        if (operationError !== undefined) {
          const primary = operationError instanceof Error ? operationError : new Error(String(operationError))
          const unlock = unlockError instanceof Error ? unlockError : new Error(String(unlockError))
          throw new AggregateError(
            [primary, unlock],
            `migration operation failed and advisory unlock failed: ${unlock.message}`,
            { cause: primary },
          )
        }
        throw unlockError
      }
    }

    if (operationError !== undefined) throw operationError
    return result
  } finally {
    client.release()
  }
}

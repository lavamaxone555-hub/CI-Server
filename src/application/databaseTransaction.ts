export interface DatabaseTransactionSession {
  begin(): void
  commit(): void
  rollback(): void
}

/** Executes a synchronous application workflow atomically through a real database transaction. */
export function withDatabaseTransaction<T>(session: DatabaseTransactionSession, operation: () => T): T {
  session.begin()
  try {
    const result = operation()
    session.commit()
    return result
  } catch (error) {
    try {
      session.rollback()
    } catch (rollbackError) {
      const message = rollbackError instanceof Error ? rollbackError.message : 'unknown rollback failure'
      throw new Error(`database transaction failed and rollback failed: ${message}`, { cause: error })
    }
    throw error
  }
}

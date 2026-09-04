export interface DatabaseTransactionSession {
  begin(): void
  commit(): void
  rollback(): void
}

/** Executes a synchronous application workflow atomically through a real database transaction. */
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(describeError(error))
}

export function withDatabaseTransaction<T>(session: DatabaseTransactionSession, operation: () => T): T {
  session.begin()
  let commitAttempted = false
  try {
    const result = operation()
    commitAttempted = true
    session.commit()
    return result
  } catch (error) {
    if (commitAttempted) throw error
    try {
      session.rollback()
    } catch (rollbackError) {
      throw new Error(`database transaction failed and rollback failed: ${describeError(rollbackError)}`, { cause: toError(error) })
    }
    throw error
  }
}

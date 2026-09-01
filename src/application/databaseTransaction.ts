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
    session.rollback()
    throw error
  }
}

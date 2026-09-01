export interface TransactionalRepository {
  begin(): void
  commit(): void
  rollback(): void
}

export function withTransaction<T>(repository: TransactionalRepository, operation: () => T): T {
  repository.begin()
  try {
    const result = operation()
    repository.commit()
    return result
  } catch (error) {
    repository.rollback()
    throw error
  }
}

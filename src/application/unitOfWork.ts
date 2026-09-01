export interface UnitOfWork {
  run<T>(operation: () => T): T
}

export const synchronousUnitOfWork: UnitOfWork = {
  run(operation) {
    return operation()
  },
}

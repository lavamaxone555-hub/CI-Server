import type { OperationResult } from './operationState'

export function runOperation<T>(operation: () => T): OperationResult<T> {
  try {
    return { state: 'success', data: operation() }
  } catch (error) {
    return {
      state: 'error',
      message: error instanceof Error ? error.message : 'Operation failed',
    }
  }
}

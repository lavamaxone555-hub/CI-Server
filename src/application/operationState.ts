export type OperationState = 'idle' | 'loading' | 'success' | 'error'

export type OperationResult<T> =
  | { state: 'success'; data: T }
  | { state: 'error'; message: string }

export function success<T>(data: T): OperationResult<T> {
  return { state: 'success', data }
}

export function failure(message: string): OperationResult<never> {
  return { state: 'error', message }
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Operation failed'
}

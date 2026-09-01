import type { OperationState } from './operationState'

export type UiState<T> = {
  state: OperationState
  data?: T
  message?: string
}

export const idleState = <T>(): UiState<T> => ({ state: 'idle' })
export const loadingState = <T>(data?: T): UiState<T> => ({ state: 'loading', data })
export const emptyState = <T>(): UiState<T> => ({ state: 'success' })
export const errorState = <T>(message: string, data?: T): UiState<T> => ({ state: 'error', message, data })
export const successState = <T>(data: T): UiState<T> => ({ state: 'success', data })

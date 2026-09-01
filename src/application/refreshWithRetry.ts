import { runOperation } from './runOperation'
import { emptyState, errorState, loadingState, successState, type UiState } from './uiState'

export function refreshWithRetry<T>(operation: () => T[]): {
  loading: UiState<T[]>
  result: UiState<T[]>
  retry: () => UiState<T[]>
} {
  const execute = (): UiState<T[]> => {
    const result = runOperation(operation)
    if (result.state === 'error') return errorState(result.message)
    return result.data.length === 0 ? emptyState() : successState(result.data)
  }

  return {
    loading: loadingState(),
    result: execute(),
    retry: execute,
  }
}

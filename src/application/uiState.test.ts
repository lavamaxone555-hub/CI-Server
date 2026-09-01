import { describe, expect, it } from 'vitest'
import { emptyState, errorState, loadingState, successState } from './uiState'

describe('ui state', () => {
  it('models loading, empty, error, and success states', () => {
    expect(loadingState()).toEqual({ state: 'loading', data: undefined })
    expect(emptyState()).toEqual({ state: 'success', isEmpty: true })
    expect(errorState('offline')).toEqual({ state: 'error', message: 'offline', data: undefined })
    expect(successState(['item'])).toEqual({ state: 'success', data: ['item'], isEmpty: false })
  })
})

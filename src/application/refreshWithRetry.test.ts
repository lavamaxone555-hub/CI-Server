import { describe, expect, it } from 'vitest'
import { refreshWithRetry } from './refreshWithRetry'

describe('refreshWithRetry', () => {
  it('returns empty state for an empty result', () => {
    const flow = refreshWithRetry(() => [])
    expect(flow.loading.state).toBe('loading')
    expect(flow.result.isEmpty).toBe(true)
  })

  it('recovers through retry after a transient failure', () => {
    let attempts = 0
    const flow = refreshWithRetry(() => {
      attempts += 1
      if (attempts === 1) throw new Error('offline')
      return ['item']
    })

    expect(flow.result.state).toBe('error')
    expect(flow.retry()).toEqual({ state: 'success', data: ['item'], isEmpty: false })
  })
})

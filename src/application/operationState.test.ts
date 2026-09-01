import { describe, expect, it } from 'vitest'
import { failure, success } from './operationState'

describe('operation state', () => {
  it('returns success results with data', () => {
    expect(success(42)).toEqual({ state: 'success', data: 42 })
  })

  it('returns error results with a message', () => {
    expect(failure('failed')).toEqual({ state: 'error', message: 'failed' })
  })
})

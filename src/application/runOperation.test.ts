import { describe, expect, it } from 'vitest'
import { runOperation } from './runOperation'

describe('runOperation', () => {
  it('captures successful operations', () => {
    expect(runOperation(() => 'ok')).toEqual({ state: 'success', data: 'ok' })
  })

  it('captures thrown errors', () => {
    expect(runOperation(() => { throw new Error('boom') })).toEqual({ state: 'error', message: 'boom' })
  })
})

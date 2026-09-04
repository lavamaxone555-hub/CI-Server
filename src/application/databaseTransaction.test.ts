import { describe, expect, it } from 'vitest'
import { withDatabaseTransaction } from './databaseTransaction'

describe('Database transaction boundary', () => {
  it('commits a successful workflow', () => {
    const calls: string[] = []
    const result = withDatabaseTransaction({ begin: () => calls.push('begin'), commit: () => calls.push('commit'), rollback: () => calls.push('rollback') }, () => {
      calls.push('sale'); calls.push('inventory'); calls.push('payment'); calls.push('imei')
      return 'ok'
    })
    expect(result).toBe('ok')
    expect(calls).toEqual(['begin', 'sale', 'inventory', 'payment', 'imei', 'commit'])
  })

  it('rolls back every persistence step when any step fails', () => {
    const calls: string[] = []
    expect(() => withDatabaseTransaction({ begin: () => calls.push('begin'), commit: () => calls.push('commit'), rollback: () => calls.push('rollback') }, () => {
      calls.push('sale'); calls.push('inventory'); calls.push('payment'); throw new Error('database failure')
    })).toThrow('database failure')
    expect(calls).toEqual(['begin', 'sale', 'inventory', 'payment', 'rollback'])
  })

  it('reports rollback failure without hiding the original transaction failure', () => {
    const original = new Error('write failed')
    expect(() => withDatabaseTransaction({
      begin: () => {}, commit: () => {}, rollback: () => { throw new Error('rollback unavailable') },
    }, () => { throw original })).toThrow('database transaction failed and rollback failed: rollback unavailable')
  })
})

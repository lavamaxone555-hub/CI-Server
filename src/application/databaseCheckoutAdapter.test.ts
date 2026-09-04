import { describe, expect, it } from 'vitest'
import { persistCheckout, type DatabaseCheckoutSession } from './databaseCheckoutAdapter'

describe('Database checkout adapter', () => {
  const sale = { id: 'sale_1', tenantId: 't', branchId: 'b', subtotal: 100, discount: 0, total: 100, status: 'paid' as const }
  const movement = { id: 'mov_1', productId: 'p', branchId: 'b', type: 'sale' as const, quantity: -1, referenceId: 'sale_1', createdAt: '2026-01-01' }
  const payment = { id: 'pay_1', saleId: 'sale_1', method: 'cash' as const, amount: 100, status: 'paid' as const }
  const imei = { imei: '123456789012345', productId: 'p', branchId: 'b', status: 'sold' as const }

  it('persists sale, inventory, payment and IMEI in one transaction', () => {
    const calls: string[] = []
    const session: DatabaseCheckoutSession = {
      begin: () => calls.push('begin'), commit: () => calls.push('commit'), rollback: () => calls.push('rollback'),
      insertSale: (x) => { calls.push('sale'); return x },
      insertInventoryMovement: (x) => { calls.push('movement'); return x },
      insertPayment: (x) => { calls.push('payment'); return x },
      updateImei: (x) => { calls.push('imei'); return x },
    }
    const result = persistCheckout(session, { sale, movements: [movement], payments: [payment], imeiUnits: [imei] })
    expect(result.sale).toEqual(sale)
    expect(calls).toEqual(['begin', 'sale', 'movement', 'payment', 'imei', 'commit'])
  })

  it('does not attempt rollback when begin fails', () => {
    const calls: string[] = []
    const session: DatabaseCheckoutSession = {
      begin: () => { calls.push('begin'); throw new Error('begin failed') }, commit: () => calls.push('commit'), rollback: () => calls.push('rollback'),
      insertSale: (x) => x, insertInventoryMovement: (x) => x, insertPayment: (x) => x, updateImei: (x) => x,
    }
    expect(() => persistCheckout(session, { sale, movements: [], payments: [], imeiUnits: [] })).toThrow('begin failed')
    expect(calls).toEqual(['begin'])
  })

  it('rolls back when any persistence operation fails', () => {
    const calls: string[] = []
    const session: DatabaseCheckoutSession = {
      begin: () => calls.push('begin'), commit: () => calls.push('commit'), rollback: () => calls.push('rollback'),
      insertSale: (x) => { calls.push('sale'); return x },
      insertInventoryMovement: () => { calls.push('movement'); throw new Error('db failed') },
      insertPayment: (x) => x, updateImei: (x) => x,
    }
    expect(() => persistCheckout(session, { sale, movements: [movement], payments: [payment], imeiUnits: [imei] })).toThrow('db failed')
    expect(calls).toEqual(['begin', 'sale', 'movement', 'rollback'])
  })

  it('does not roll back when checkout commit begins and fails synchronously', () => {
    const calls: string[] = []
    const session: DatabaseCheckoutSession = {
      begin: () => calls.push('begin'), commit: () => { calls.push('commit'); throw new Error('commit failed') }, rollback: () => calls.push('rollback'),
      insertSale: (x) => { calls.push('sale'); return x }, insertInventoryMovement: (x) => x,
      insertPayment: (x) => x, updateImei: (x) => x,
    }
    expect(() => persistCheckout(session, { sale, movements: [], payments: [], imeiUnits: [] })).toThrow('commit failed')
    expect(calls).toEqual(['begin', 'sale', 'commit'])
  })

  it('does not roll back after a commit failure because checkout outcome is unknown', () => {
    const calls: string[] = []
    const session: DatabaseCheckoutSession = {
      begin: () => calls.push('begin'), commit: () => { calls.push('commit'); throw new Error('commit failed') }, rollback: () => calls.push('rollback'),
      insertSale: (x) => { calls.push('sale'); return x }, insertInventoryMovement: (x) => x,
      insertPayment: (x) => x, updateImei: (x) => x,
    }
    expect(() => persistCheckout(session, { sale, movements: [], payments: [], imeiUnits: [] })).toThrow('commit failed')
    expect(calls).toEqual(['begin', 'sale', 'commit'])
  })

  it('reports rollback failure without hiding checkout persistence failure', () => {
    const original = new Error('db failed')
    const session: DatabaseCheckoutSession = {
      begin: () => {}, commit: () => {}, rollback: () => { throw new Error('rollback unavailable') },
      insertSale: () => { throw original }, insertInventoryMovement: (x) => x,
      insertPayment: (x) => x, updateImei: (x) => x,
    }
    expect(() => persistCheckout(session, { sale, movements: [], payments: [], imeiUnits: [] }))
      .toThrow('checkout persistence failed and rollback failed: rollback unavailable')
  })
})

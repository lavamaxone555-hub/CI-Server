import { describe, expect, it } from 'vitest'
import { checkoutSale } from './salesService'
import { retailStore } from '../domain/retailStore'
import type { TransactionalRetailRepository } from './retailRepository'

describe('Sales application service', () => {
  it('persists a successful checkout through a transaction boundary', () => {
    const repository = makeRepository()
    const before = retailStore.sales.length
    const sale = checkoutSale({
      tenantId: retailStore.tenant.id,
      branchId: 'branch_main',
      items: [{ productId: 'prd_003', name: 'USB-C 20W Adapter', qty: 1, unitPrice: 590, discount: 0 }],
      paid: 1000,
      paymentMethod: 'cash',
    }, repository)
    expect(repository.commits).toBe(1)
    expect(repository.rollbacks).toBe(0)
    expect(retailStore.sales.length).toBe(before + 1)
    expect(retailStore.sales.at(-1)?.id).toBe(sale.id)
  })

  it('rolls back the repository when persistence fails', () => {
    const before = retailStore.sales.map((sale) => sale.id)
    const repository = makeRepository(true)

    expect(() => checkoutSale({
      tenantId: retailStore.tenant.id,
      branchId: 'branch_main',
      items: [{ productId: 'prd_003', name: 'USB-C 20W Adapter', qty: 1, unitPrice: 590, discount: 0 }],
      paid: 1000,
      paymentMethod: 'cash',
    }, repository)).toThrow('persistence failed')

    expect(repository.commits).toBe(0)
    expect(repository.rollbacks).toBe(1)
    expect(retailStore.sales.map((sale) => sale.id)).toEqual(before)
  })
})

function makeRepository(failOnSave = false): TransactionalRetailRepository & { commits: number; rollbacks: number } {
  const snapshot = [...retailStore.sales]
  let active = false
  const result = {
    commits: 0,
    rollbacks: 0,
    begin() {
      active = true
    },
    commit() {
      active = false
      result.commits += 1
    },
    rollback() {
      retailStore.sales.splice(0, retailStore.sales.length, ...snapshot)
      active = false
      result.rollbacks += 1
    },
    saveSale(sale: (typeof retailStore.sales)[number]) {
      if (!active) throw new Error('transaction not active')
      if (failOnSave) throw new Error('persistence failed')
      retailStore.sales.push(sale)
      return sale
    },
    deleteSale(id: string) {
      const index = retailStore.sales.findIndex((sale) => sale.id === id)
      if (index >= 0) retailStore.sales.splice(index, 1)
    },
    findSale(id: string) {
      return retailStore.sales.find((sale) => sale.id === id)
    },
  }
  return result
}

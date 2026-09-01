import { describe, expect, it } from 'vitest'
import { checkoutSale } from './salesService'
import { retailStore } from '../domain/retailStore'
import { inventoryMovements } from '../domain/inventory'
import { paymentsForSale } from '../domain/payment'
import { inMemoryRetailRepository } from './inMemoryRetailRepository'
import type { TransactionalRetailRepository } from './retailRepository'

describe('Sales application service', () => {
  it('persists a successful checkout through a transaction boundary', () => {
    const repository = makeRepository()
    const before = retailStore.sales.length
    const stockBefore = retailStore.inventory.find(i => i.productId === 'prd_003' && i.branchId === 'branch_main')!.quantity
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
    expect(retailStore.inventory.find(i => i.productId === 'prd_003' && i.branchId === 'branch_main')!.quantity).toBe(stockBefore - 1)
    expect(inventoryMovements().filter(m => m.referenceId === sale.id)).toHaveLength(1)
    expect(paymentsForSale(sale.id)).toHaveLength(1)
  })

  it('rolls back sale, inventory movement, stock, and payment when persistence fails', () => {
    const repository = makeFailingRepository()
    const salesBefore = retailStore.sales.map(sale => sale.id)
    const stockBefore = retailStore.inventory.find(i => i.productId === 'prd_003' && i.branchId === 'branch_main')!.quantity
    const movementsBefore = inventoryMovements().length

    expect(() => checkoutSale({
      tenantId: retailStore.tenant.id,
      branchId: 'branch_main',
      items: [{ productId: 'prd_003', name: 'USB-C 20W Adapter', qty: 1, unitPrice: 590, discount: 0 }],
      paid: 1000,
      paymentMethod: 'cash',
    }, repository)).toThrow('persistence failed')

    expect(repository.commits).toBe(0)
    expect(repository.rollbacks).toBe(1)
    expect(retailStore.sales.map(sale => sale.id)).toEqual(salesBefore)
    expect(retailStore.inventory.find(i => i.productId === 'prd_003' && i.branchId === 'branch_main')!.quantity).toBe(stockBefore)
    expect(inventoryMovements()).toHaveLength(movementsBefore)
  })
})

function makeRepository(): TransactionalRetailRepository & { commits: number; rollbacks: number } {
  const result = {
    commits: 0,
    rollbacks: 0,
    begin() { inMemoryRetailRepository.begin() },
    commit() { inMemoryRetailRepository.commit(); result.commits += 1 },
    rollback() { inMemoryRetailRepository.rollback(); result.rollbacks += 1 },
    saveSale(sale: (typeof retailStore.sales)[number]) { return inMemoryRetailRepository.saveSale(sale) },
    deleteSale(id: string) { inMemoryRetailRepository.deleteSale(id) },
    findSale(id: string) { return inMemoryRetailRepository.findSale(id) },
  }
  return result
}

function makeFailingRepository(): TransactionalRetailRepository & { commits: number; rollbacks: number } {
  const result = makeRepository()
  result.saveSale = () => { throw new Error('persistence failed') }
  return result
}

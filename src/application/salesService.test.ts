import { describe, expect, it } from 'vitest'
import { checkoutSale } from './salesService'
import { retailStore } from '../domain/retailStore'

describe('Sales application service', () => {
  it('persists a successful checkout through the repository boundary', () => {
    const before = retailStore.sales.length
    const sale = checkoutSale({
      tenantId: retailStore.tenant.id,
      branchId: 'branch_main',
      items: [{ productId: 'prd_003', name: 'USB-C 20W Adapter', qty: 1, unitPrice: 590, discount: 0 }],
      paid: 1000,
      paymentMethod: 'cash',
    })
    expect(retailStore.sales.length).toBe(before + 1)
    expect(retailStore.sales.at(-1)?.id).toBe(sale.id)
  })
})

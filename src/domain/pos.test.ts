import { describe, expect, it } from 'vitest'
import { checkout, calculateSale, completeSale } from './pos'
import { retailStore } from './retailStore'

describe('POS engine', () => {
  const items = [{ productId: 'p1', name: 'Phone', qty: 2, unitPrice: 1000, discount: 100 }]
  it('calculates subtotal, discount, tax and total', () => expect(calculateSale(items)).toEqual({ subtotal: 1900, discount: 0, tax: 133, total: 2033 }))
  it('completes a paid sale and calculates change', () => expect(completeSale(items, 2500).change).toBe(467))
  it('rejects insufficient payment', () => expect(() => completeSale(items, 2000)).toThrow('ยอดชำระไม่เพียงพอ'))
  it('rejects an empty cart', () => expect(() => completeSale([], 0)).toThrow('ตะกร้าสินค้าว่าง'))

  it('checks out a non-IMEI product, records sale/payment and decreases stock', () => {
    const before = retailStore.inventory.find(i => i.productId === 'prd_003' && i.branchId === 'branch_main')!.quantity
    const sale = checkout({ tenantId: retailStore.tenant.id, branchId: 'branch_main', items: [{ productId: 'prd_003', name: 'USB-C 20W Adapter', qty: 1, unitPrice: 590, discount: 0 }], paid: 1000, paymentMethod: 'cash' })
    expect(sale.total).toBe(631.3)
    expect(retailStore.inventory.find(i => i.productId === 'prd_003' && i.branchId === 'branch_main')!.quantity).toBe(before - 1)
    expect(retailStore.sales.at(-1)?.status).toBe('paid')
  })
})

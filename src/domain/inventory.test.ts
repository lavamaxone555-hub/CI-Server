import { describe, expect, it } from 'vitest'
import { inventoryMovements, moveInventory } from './inventory'
import { retailStore } from './retailStore'

describe('Inventory movements', () => {
  it('receives stock and records a movement', () => {
    const before = retailStore.inventory.find(i => i.productId === 'prd_001')!.quantity
    moveInventory({ productId: 'prd_001', branchId: 'branch_main', type: 'receive', quantity: 3, note: 'PO-001' })
    expect(retailStore.inventory.find(i => i.productId === 'prd_001')!.quantity).toBe(before + 3)
    expect(inventoryMovements().at(-1)?.type).toBe('receive')
  })
})

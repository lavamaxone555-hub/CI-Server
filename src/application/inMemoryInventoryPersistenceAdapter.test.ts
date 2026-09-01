import { describe, expect, it } from 'vitest'
import { InMemoryInventoryPersistenceAdapter } from './inMemoryInventoryPersistenceAdapter'

describe('InMemoryInventoryPersistenceAdapter', () => {
  it('persists and filters inventory movements', () => {
    const repository = new InMemoryInventoryPersistenceAdapter()
    repository.recordMovement({ id: '1', productId: 'p1', branchId: 'b1', type: 'sale', quantity: -1, referenceId: 'sale-1', createdAt: 'now' })
    repository.recordMovement({ id: '2', productId: 'p2', branchId: 'b1', type: 'receive', quantity: 2, referenceId: 'receive-1', createdAt: 'now' })

    expect(repository.listMovements()).toHaveLength(2)
    expect(repository.listMovements('sale-1')).toHaveLength(1)
    expect(repository.listMovements('missing')).toEqual([])
  })
})

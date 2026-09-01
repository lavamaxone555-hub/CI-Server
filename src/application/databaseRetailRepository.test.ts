import { describe, expect, it } from 'vitest'
import { createDatabaseRetailRepository, type DatabaseSession } from './databaseRetailRepository'
import type { Sale } from '../domain/retail'

function sale(id = 'sale_db_001'): Sale {
  return {
    id,
    tenantId: 'tenant_001',
    branchId: 'branch_main',
    subtotal: 100,
    discount: 0,
    total: 100,
    status: 'paid',
  }
}

describe('Database retail repository', () => {
  it('delegates transaction and persistence operations to the database session', () => {
    const calls: string[] = []
    const rows = new Map<string, Sale>()
    const session: DatabaseSession = {
      begin: () => { calls.push('begin') },
      commit: () => { calls.push('commit') },
      rollback: () => { calls.push('rollback') },
      insertSale: (value) => { calls.push('insert'); rows.set(value.id, value); return value },
      deleteSale: (id) => { calls.push('delete'); rows.delete(id) },
      findSale: (id) => { calls.push('find'); return rows.get(id) },
    }
    const repository = createDatabaseRetailRepository(session)
    const stored = sale()

    repository.begin()
    repository.saveSale(stored)
    expect(repository.findSale(stored.id)).toEqual(stored)
    repository.deleteSale(stored.id)
    repository.commit()

    expect(calls).toEqual(['begin', 'insert', 'find', 'delete', 'commit'])
    expect(repository.findSale(stored.id)).toBeUndefined()
    repository.rollback()
    expect(calls.at(-1)).toBe('rollback')
  })
})

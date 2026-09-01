import { describe, expect, it } from 'vitest'
import { retailSchema } from './databaseSchema'

describe('Retail database schema', () => {
  it('defines production tables for checkout persistence', () => {
    expect(Object.keys(retailSchema)).toEqual(['sales', 'inventoryMovements', 'payments', 'imeiUnits'])
    expect(retailSchema.sales.id).toContain('primary key')
    expect(retailSchema.inventoryMovements.referenceId).toContain('indexed')
    expect(retailSchema.payments.saleId).toContain('indexed')
    expect(retailSchema.imeiUnits.imei).toContain('primary key')
  })
})

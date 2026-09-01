import { describe, expect, it } from 'vitest'
import { createSqlDatabaseCheckoutSession } from './sqlDatabaseCheckoutSession'

describe('SQL database checkout session', () => {
  it('maps checkout operations to SQL transaction statements', () => {
    const statements: string[] = []
    const session = createSqlDatabaseCheckoutSession({ execute: (sql) => statements.push(sql) })
    session.begin()
    session.insertSale({ id: 's', tenantId: 't', branchId: 'b', subtotal: 10, discount: 0, total: 10, status: 'paid' })
    session.insertInventoryMovement({ id: 'm', productId: 'p', branchId: 'b', referenceId: 's', quantity: -1, type: 'sale', createdAt: '2026-01-01' })
    session.insertPayment({ id: 'pay', saleId: 's', method: 'cash', amount: 10, status: 'paid' })
    session.updateImei({ imei: '123456789012345', productId: 'p', branchId: 'b', status: 'sold' })
    session.commit()
    expect(statements).toHaveLength(6)
    expect(statements[0]).toBe('BEGIN')
    expect(statements.at(-1)).toBe('COMMIT')
    expect(statements.join('\n')).toContain('INSERT INTO sales')
    expect(statements.join('\n')).toContain('UPDATE imei_units')
  })
})

import type { ImeiUnit } from '../domain/imei'
import type { InventoryMovement } from '../domain/inventory'
import type { Payment } from '../domain/payment'
import type { Sale } from '../domain/retail'
import type { DatabaseCheckoutSession } from './databaseCheckoutAdapter'

export interface SqlExecutor {
  execute(sql: string, parameters?: unknown[]): void
}

/** PostgreSQL-style concrete driver adapter. Inject a real connection/transaction executor. */
export function createSqlDatabaseCheckoutSession(executor: SqlExecutor): DatabaseCheckoutSession {
  return {
    begin: () => executor.execute('BEGIN'),
    commit: () => executor.execute('COMMIT'),
    rollback: () => executor.execute('ROLLBACK'),
    insertSale: (sale: Sale) => {
      executor.execute(
        'INSERT INTO sales (id, tenant_id, branch_id, subtotal, discount, total, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [sale.id, sale.tenantId, sale.branchId, sale.subtotal, sale.discount, sale.total, sale.status],
      )
      return sale
    },
    insertInventoryMovement: (movement: InventoryMovement) => {
      executor.execute(
        'INSERT INTO inventory_movements (id, product_id, branch_id, reference_id, quantity, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [movement.id, movement.productId, movement.branchId, movement.referenceId, movement.quantity, movement.type],
      )
      return movement
    },
    insertPayment: (payment: Payment) => {
      executor.execute('INSERT INTO payments (id, sale_id, amount, method, status) VALUES ($1, $2, $3, $4, $5)', [payment.id, payment.saleId, payment.amount, payment.method, payment.status])
      return payment
    },
    updateImei: (unit: ImeiUnit) => {
      executor.execute('UPDATE imei_units SET status = $1 WHERE imei = $2 AND product_id = $3 AND branch_id = $4', [unit.status, unit.imei, unit.productId, unit.branchId])
      return unit
    },
  }
}

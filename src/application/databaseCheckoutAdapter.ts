import type { InventoryMovement } from '../domain/inventory'
import type { Payment } from '../domain/payment'
import type { ImeiUnit } from '../domain/imei'
import type { Sale } from '../domain/retail'
import type { DatabaseTransactionSession } from './databaseTransaction'

export interface DatabaseCheckoutSession extends DatabaseTransactionSession {
  insertSale(sale: Sale): Sale
  insertInventoryMovement(movement: InventoryMovement): InventoryMovement
  insertPayment(payment: Payment): Payment
  updateImei(unit: ImeiUnit): ImeiUnit
}

/** Concrete production adapter for persisting a complete checkout atomically. */
export function persistCheckout(
  session: DatabaseCheckoutSession,
  data: { sale: Sale; movements: InventoryMovement[]; payments: Payment[]; imeiUnits: ImeiUnit[] },
) {
  session.begin()
  try {
    const sale = session.insertSale(data.sale)
    const movements = data.movements.map((movement) => session.insertInventoryMovement(movement))
    const payments = data.payments.map((payment) => session.insertPayment(payment))
    const imeiUnits = data.imeiUnits.map((unit) => session.updateImei(unit))
    session.commit()
    return { sale, movements, payments, imeiUnits }
  } catch (error) {
    session.rollback()
    throw error
  }
}

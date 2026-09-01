import { retailStore } from '../domain/retailStore'
import { restoreInventoryState, snapshotInventoryState } from '../domain/inventory'
import { restorePayments, snapshotPayments, type Payment } from '../domain/payment'
import { restoreImeiState, snapshotImeiState } from '../domain/imei'
import type { Sale } from '../domain/retail'
import type { TransactionalRetailRepository } from './retailRepository'

let transactionSnapshot: {
  sales: Sale[]
  inventory: ReturnType<typeof snapshotInventoryState>
  payments: Payment[]
  imei: ReturnType<typeof snapshotImeiState>
} | undefined

export const inMemoryRetailRepository: TransactionalRetailRepository = {
  begin() {
    if (transactionSnapshot) throw new Error('Transaction already active')
    transactionSnapshot = {
      sales: [...retailStore.sales],
      inventory: snapshotInventoryState(),
      payments: snapshotPayments(),
      imei: snapshotImeiState(),
    }
  },
  commit() {
    transactionSnapshot = undefined
  },
  rollback() {
    if (!transactionSnapshot) return
    retailStore.sales.splice(0, retailStore.sales.length, ...transactionSnapshot.sales)
    restoreInventoryState(transactionSnapshot.inventory)
    restorePayments(transactionSnapshot.payments)
    restoreImeiState(transactionSnapshot.imei)
    transactionSnapshot = undefined
  },
  saveSale(sale) {
    retailStore.sales.push(sale)
    return sale
  },
  deleteSale(id) {
    const index = retailStore.sales.findIndex((sale) => sale.id === id)
    if (index >= 0) retailStore.sales.splice(index, 1)
  },
  findSale(id) {
    return retailStore.sales.find((sale) => sale.id === id)
  },
}

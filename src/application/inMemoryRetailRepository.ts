import { retailStore } from '../domain/retailStore'
import type { Sale } from '../domain/retail'
import type { TransactionalRetailRepository } from './retailRepository'

let transactionSnapshot: Sale[] | undefined

export const inMemoryRetailRepository: TransactionalRetailRepository = {
  begin() {
    if (transactionSnapshot) throw new Error('Transaction already active')
    transactionSnapshot = [...retailStore.sales]
  },
  commit() {
    transactionSnapshot = undefined
  },
  rollback() {
    if (!transactionSnapshot) return
    retailStore.sales.splice(0, retailStore.sales.length, ...transactionSnapshot)
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

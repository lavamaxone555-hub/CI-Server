import { retailStore } from '../domain/retailStore'
import type { RetailRepository } from './retailRepository'

export const inMemoryRetailRepository: RetailRepository = {
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

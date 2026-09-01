import type { Sale } from '../domain/retail'

export interface RetailRepository {
  saveSale(sale: Sale): Sale
  deleteSale(id: string): void
  findSale(id: string): Sale | undefined
}

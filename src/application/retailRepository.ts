import type { Sale } from '../domain/retail'

export interface RetailRepository {
  saveSale(sale: Sale): Sale
  deleteSale(id: string): void
  findSale(id: string): Sale | undefined
}

export interface TransactionalRetailRepository extends RetailRepository {
  begin(): void
  commit(): void
  rollback(): void
}

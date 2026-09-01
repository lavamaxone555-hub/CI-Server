import type { Sale } from '../domain/retail'
import type { TransactionalRetailRepository } from './retailRepository'

export interface DatabaseSession {
  begin(): void
  commit(): void
  rollback(): void
  insertSale(sale: Sale): Sale
  deleteSale(id: string): void
  findSale(id: string): Sale | undefined
}

/**
 * Production persistence boundary. The concrete database driver owns the
 * transaction; application code only depends on the repository contract.
 */
export function createDatabaseRetailRepository(session: DatabaseSession): TransactionalRetailRepository {
  return {
    begin: () => session.begin(),
    commit: () => session.commit(),
    rollback: () => session.rollback(),
    saveSale: (sale) => session.insertSale(sale),
    deleteSale: (id) => session.deleteSale(id),
    findSale: (id) => session.findSale(id),
  }
}

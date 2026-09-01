import { checkout, type CheckoutInput } from '../domain/pos'
import type { Sale } from '../domain/retail'
import { retailStore } from '../domain/retailStore'
import { withTransaction } from './transaction'
import { inMemoryRetailRepository } from './inMemoryRetailRepository'
import type { RetailRepository, TransactionalRetailRepository } from './retailRepository'

export function checkoutSale(
  input: CheckoutInput,
  repository: TransactionalRetailRepository = inMemoryRetailRepository,
) {
  return withTransaction(repository, () => {
    const result = checkout(input)
    const stored = retailStore.sales.find((sale) => sale.id === result.id)
    if (!stored) throw new Error('Sale was not recorded')
    const index = retailStore.sales.indexOf(stored)
    retailStore.sales.splice(index, 1)
    repository.saveSale(stored)
    return result
  })
}

export function findSale(id: string, repository: RetailRepository = inMemoryRetailRepository): Sale | undefined {
  return repository.findSale(id)
}

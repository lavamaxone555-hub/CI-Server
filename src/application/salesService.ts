import { checkout, type CheckoutInput } from '../domain/pos'
import type { Sale } from '../domain/retail'
import { retailStore } from '../domain/retailStore'
import { inMemoryRetailRepository } from './inMemoryRetailRepository'
import type { RetailRepository } from './retailRepository'

export function checkoutSale(input: CheckoutInput, repository: RetailRepository = inMemoryRetailRepository) {
  const result = checkout(input)
  const stored = retailStore.sales.find((sale) => sale.id === result.id)
  if (!stored) throw new Error('Sale was not recorded')
  const index = retailStore.sales.indexOf(stored)
  retailStore.sales.splice(index, 1)
  try {
    repository.saveSale(stored)
    return result
  } catch (error) {
    repository.deleteSale(result.id)
    throw error
  }
}

export function findSale(id: string, repository: RetailRepository = inMemoryRetailRepository): Sale | undefined {
  return repository.findSale(id)
}

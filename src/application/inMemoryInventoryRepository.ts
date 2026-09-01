import { inventoryMovements } from '../domain/inventory'
import type { InventoryRepository } from './inventoryRepository'

export const inMemoryInventoryRepository: InventoryRepository = {
  recordMovement(movement) {
    return movement
  },
  listMovements(referenceId) {
    const movements = inventoryMovements()
    return referenceId ? movements.filter((movement) => movement.referenceId === referenceId) : movements
  },
}

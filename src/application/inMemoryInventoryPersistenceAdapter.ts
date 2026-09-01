import type { InventoryMovement } from '../domain/inventory'
import type { InventoryRepository } from './inventoryRepository'

export class InMemoryInventoryPersistenceAdapter implements InventoryRepository {
  private readonly movements: InventoryMovement[] = []

  recordMovement(movement: InventoryMovement): InventoryMovement {
    this.movements.push(movement)
    return movement
  }

  listMovements(referenceId?: string): InventoryMovement[] {
    return referenceId
      ? this.movements.filter((movement) => movement.referenceId === referenceId)
      : [...this.movements]
  }

  clear(): void {
    this.movements.length = 0
  }
}

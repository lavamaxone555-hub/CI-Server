import type { InventoryMovement } from '../domain/inventory'

export interface InventoryRepository {
  recordMovement(movement: InventoryMovement): InventoryMovement
  listMovements(referenceId?: string): InventoryMovement[]
}

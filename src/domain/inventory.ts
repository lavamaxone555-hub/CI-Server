import { retailStore } from './retailStore'

export type InventoryMovement = {
  id: string
  productId: string
  branchId: string
  type: 'sale' | 'receive' | 'adjust' | 'return'
  quantity: number
  referenceId?: string
  note?: string
  createdAt: string
}

const movements: InventoryMovement[] = []

export function moveInventory(input: Omit<InventoryMovement, 'id' | 'createdAt'>) {
  const stock = retailStore.inventory.find((item) => item.productId === input.productId && item.branchId === input.branchId)
  if (!stock) throw new Error('Inventory item not found')
  if (input.type === 'sale' || input.type === 'adjust' || input.type === 'return') {
    const next = stock.quantity + input.quantity
    if (next < 0) throw new Error('Insufficient stock')
    stock.quantity = next
  } else {
    stock.quantity += Math.max(0, input.quantity)
  }
  const movement: InventoryMovement = { ...input, id: `mov_${Date.now()}_${movements.length}`, createdAt: new Date().toISOString() }
  movements.push(movement)
  return movement
}

export function inventoryMovements() { return [...movements] }

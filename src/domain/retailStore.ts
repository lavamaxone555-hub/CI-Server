import { seedBranches, seedCategories, seedInventory, seedProducts, seedTenant, type Customer, type Sale } from './retail'

const customers: Customer[] = [
  { id: 'cus_001', tenantId: seedTenant.id, name: 'ลูกค้าทั่วไป', phone: '-', loyaltyPoints: 0 },
]
const sales: Sale[] = []

export const retailStore = {
  tenant: seedTenant,
  branches: seedBranches,
  categories: seedCategories,
  products: seedProducts,
  inventory: seedInventory,
  customers,
  sales,
  addSale(input: Omit<Sale, 'id'> & { id?: string }) {
    const sale: Sale = { ...input, id: input.id ?? `sale_${Date.now()}` }
    sales.push(sale)
    return sale
  },
}

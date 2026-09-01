export type ID = string

export type Tenant = { id: ID; name: string; code: string; currency: string; timezone: string }
export type Branch = { id: ID; tenantId: ID; name: string; code: string; active: boolean }
export type Category = { id: ID; tenantId: ID; name: string; slug: string }
export type Product = { id: ID; tenantId: ID; sku: string; name: string; brand: string; categoryId: ID; cost: number; price: number; trackImei: boolean; active: boolean }
export type InventoryItem = { id: ID; productId: ID; branchId: ID; quantity: number; reserved: number; reorderPoint: number }
export type Customer = { id: ID; tenantId: ID; name: string; phone: string; email?: string; loyaltyPoints: number }
export type Sale = { id: ID; tenantId: ID; branchId: ID; customerId?: ID; subtotal: number; discount: number; total: number; status: 'draft' | 'paid' | 'void' }

export const seedTenant: Tenant = { id: 'tenant_demo', name: 'RetailOS Demo', code: 'DEMO', currency: 'THB', timezone: 'Asia/Bangkok' }
export const seedBranches: Branch[] = [{ id: 'branch_main', tenantId: seedTenant.id, name: 'สำนักงานใหญ่', code: 'HQ', active: true }]
export const seedCategories: Category[] = [
  { id: 'cat_phone', tenantId: seedTenant.id, name: 'สมาร์ตโฟน', slug: 'smartphone' },
  { id: 'cat_accessory', tenantId: seedTenant.id, name: 'อุปกรณ์เสริม', slug: 'accessory' },
]
export const seedProducts: Product[] = [
  { id: 'prd_001', tenantId: seedTenant.id, sku: 'IPH-15-128', name: 'iPhone 15 128GB', brand: 'Apple', categoryId: 'cat_phone', cost: 24500, price: 29900, trackImei: true, active: true },
  { id: 'prd_002', tenantId: seedTenant.id, sku: 'SAM-S24-256', name: 'Galaxy S24 256GB', brand: 'Samsung', categoryId: 'cat_phone', cost: 21900, price: 26900, trackImei: true, active: true },
  { id: 'prd_003', tenantId: seedTenant.id, sku: 'USB-C-20W', name: 'USB-C 20W Adapter', brand: 'RetailOS', categoryId: 'cat_accessory', cost: 350, price: 590, trackImei: false, active: true },
]
export const seedInventory: InventoryItem[] = [
  { id: 'inv_001', productId: 'prd_001', branchId: 'branch_main', quantity: 12, reserved: 1, reorderPoint: 5 },
  { id: 'inv_002', productId: 'prd_002', branchId: 'branch_main', quantity: 8, reserved: 0, reorderPoint: 5 },
  { id: 'inv_003', productId: 'prd_003', branchId: 'branch_main', quantity: 42, reserved: 4, reorderPoint: 15 },
]

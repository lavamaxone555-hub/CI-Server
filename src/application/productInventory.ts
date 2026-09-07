export type BarcodeFormat = 'EAN13' | 'UPC' | 'CODE128' | 'CUSTOM'

export type ProductRecord = {
  id: string
  tenantId: string
  sku: string
  barcode?: string
  barcodeFormat?: BarcodeFormat
  name: string
  brand: string
  trackImei: boolean
  active: boolean
}

export type ImeiUnit = {
  imei: string
  productId: string
  tenantId: string
  branchId: string
  status: 'in_stock' | 'reserved' | 'sold' | 'repair'
}

export function assertProductTenant(product: ProductRecord, tenantId: string) {
  if (product.tenantId !== tenantId) throw new Error('Product tenant mismatch')
}

export function assertBarcodeUnique(products: readonly ProductRecord[], tenantId: string, barcode: string, exceptId?: string) {
  const duplicate = products.find(p => p.tenantId === tenantId && p.barcode === barcode && p.id !== exceptId)
  if (duplicate) throw new Error('Barcode already exists in tenant')
}

export function assertImeiAvailable(unit: ImeiUnit, tenantId: string, branchId: string) {
  if (unit.tenantId !== tenantId || unit.branchId !== branchId || unit.status !== 'in_stock') {
    throw new Error('IMEI unit unavailable')
  }
}

export function availableQuantity(quantity: number, reserved: number) {
  return Math.max(0, quantity - reserved)
}

export function assertStockMovement(quantity: number, delta: number) {
  const next = quantity + delta
  if (next < 0) throw new Error('Insufficient stock')
  return next
}

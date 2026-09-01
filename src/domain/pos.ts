import { moveInventory } from './inventory'
import { getImei, setImeiStatus } from './imei'
import { recordPayment, type PaymentMethod } from './payment'
import { retailStore } from './retailStore'

export type CartItem = { productId: string; name: string; qty: number; unitPrice: number; discount: number; imei?: string }
export type Sale = { id: string; items: CartItem[]; subtotal: number; discount: number; tax: number; total: number; paid: number; change: number; createdAt: string }

export function lineTotal(item: CartItem): number { return Math.max(0, item.qty * item.unitPrice - item.discount) }
export function calculateSale(items: CartItem[], orderDiscount = 0, taxRate = 0.07) {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0)
  const discount = Math.min(Math.max(0, orderDiscount), subtotal)
  const taxable = subtotal - discount
  const tax = Math.round(taxable * taxRate * 100) / 100
  const total = Math.round((taxable + tax) * 100) / 100
  return { subtotal, discount, tax, total }
}

export function completeSale(items: CartItem[], paid: number, orderDiscount = 0, taxRate = 0.07): Sale {
  if (!items.length) throw new Error('ตะกร้าสินค้าว่าง')
  if (items.some(i => i.qty <= 0 || i.unitPrice < 0)) throw new Error('ข้อมูลสินค้าไม่ถูกต้อง')
  const totals = calculateSale(items, orderDiscount, taxRate)
  if (paid < totals.total) throw new Error('ยอดชำระไม่เพียงพอ')
  return { id: `SALE-${Date.now()}`, items, ...totals, paid, change: Math.round((paid - totals.total) * 100) / 100, createdAt: new Date().toISOString() }
}

export type CheckoutInput = {
  tenantId: string
  branchId: string
  customerId?: string
  items: CartItem[]
  paid: number
  paymentMethod: PaymentMethod
  orderDiscount?: number
  taxRate?: number
}

export function checkout(input: CheckoutInput) {
  if (input.tenantId !== retailStore.tenant.id) throw new Error('Tenant ไม่ถูกต้อง')
  if (!retailStore.branches.some(b => b.id === input.branchId && b.tenantId === input.tenantId && b.active)) throw new Error('สาขาไม่พร้อมใช้งาน')
  if (!input.items.length) throw new Error('ตะกร้าสินค้าว่าง')
  const productMap = new Map(retailStore.products.map(p => [p.id, p]))
  const imeiUnits: Array<{ imei: string; productId: string; branchId: string }> = []
  for (const item of input.items) {
    const product = productMap.get(item.productId)
    if (!product || !product.active || product.tenantId !== input.tenantId) throw new Error('สินค้าไม่ถูกต้อง')
    const stock = retailStore.inventory.find(i => i.productId === item.productId && i.branchId === input.branchId)
    if (!stock || stock.quantity - stock.reserved < item.qty) throw new Error(`สต็อกไม่เพียงพอ: ${item.name}`)
    if (product.trackImei && (item.qty !== 1 || !item.imei)) throw new Error(`ต้องระบุ IMEI: ${item.name}`)
    if (item.imei) {
      const unit = getImei(item.imei)
      if (!unit || unit.productId !== item.productId || unit.branchId !== input.branchId || unit.status !== 'in_stock') throw new Error('IMEI ไม่พร้อมจำหน่ายหรือไม่ตรงกับสินค้า/สาขา')
      imeiUnits.push(unit)
    }
  }
  const sale = completeSale(input.items, input.paid, input.orderDiscount, input.taxRate)
  const storedSale = retailStore.addSale({ id: sale.id, tenantId: input.tenantId, branchId: input.branchId, customerId: input.customerId, subtotal: sale.subtotal, discount: sale.discount, total: sale.total, status: 'paid' })
  try {
    for (const item of input.items) moveInventory({ productId: item.productId, branchId: input.branchId, type: 'sale', quantity: -item.qty, referenceId: sale.id })
    for (const unit of imeiUnits) setImeiStatus(unit.imei, 'sold')
    recordPayment({ saleId: storedSale.id, method: input.paymentMethod, amount: sale.total })
  } catch (error) {
    const index = retailStore.sales.findIndex(s => s.id === storedSale.id)
    if (index >= 0) retailStore.sales.splice(index, 1)
    throw error
  }
  return sale
}

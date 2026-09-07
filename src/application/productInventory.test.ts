import { describe, expect, it } from 'vitest'
import { assertBarcodeUnique, assertImeiAvailable, assertStockMovement, availableQuantity, type ImeiUnit, type ProductRecord } from './productInventory'

const product: ProductRecord = { id:'p1', tenantId:'t1', sku:'SKU-1', barcode:'123', name:'Phone', brand:'Brand', trackImei:true, active:true }
const imei: ImeiUnit = { imei:'111', productId:'p1', tenantId:'t1', branchId:'b1', status:'in_stock' }

describe('product inventory controls', () => {
  it('prevents duplicate barcode inside a tenant', () => expect(() => assertBarcodeUnique([product],'t1','123','p2')).toThrow())
  it('allows same barcode in another tenant boundary', () => expect(() => assertBarcodeUnique([product],'t2','123')).not.toThrow())
  it('enforces IMEI availability', () => expect(() => assertImeiAvailable(imei,'t1','b1')).not.toThrow())
  it('prevents negative stock', () => expect(() => assertStockMovement(2,-3)).toThrow())
  it('calculates available stock', () => expect(availableQuantity(10,3)).toBe(7))
})

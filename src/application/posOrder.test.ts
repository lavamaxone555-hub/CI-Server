import { describe, expect, it } from 'vitest'
import { calculateOrder, invoiceNumber, validatePayments } from './posOrder'

describe('POS order payment invoice', () => {
  it('calculates order totals', () => expect(calculateOrder([{productId:'p1',quantity:2,unitPrice:100}],20)).toEqual({subtotal:200,discount:20,total:180}))
  it('rejects insufficient payment', () => expect(() => validatePayments(100,[{method:'cash',amount:90}])).toThrow())
  it('calculates change', () => expect(validatePayments(100,[{method:'cash',amount:120}])).toEqual({paid:120,change:20}))
  it('creates invoice number', () => expect(invoiceNumber('DEMO',12)).toBe('DEMO-00000012'))
})

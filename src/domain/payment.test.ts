import { describe, expect, it } from 'vitest'
import { recordPayment } from './payment'

describe('Payments', () => {
  it('records a paid payment', () => {
    expect(recordPayment({ saleId: 'sale_test', method: 'qr', amount: 100 }).status).toBe('paid')
  })
})

import { describe, expect, it } from 'vitest'
import { registerImei, setImeiStatus } from './imei'

describe('IMEI', () => {
  it('registers and changes status', () => {
    const imei = `${Date.now()}`.slice(-15).padStart(15, '0')
    expect(registerImei({ imei, productId: 'prd_001', branchId: 'branch_main', status: 'in_stock' }).status).toBe('in_stock')
    expect(setImeiStatus(imei, 'sold').status).toBe('sold')
  })
})

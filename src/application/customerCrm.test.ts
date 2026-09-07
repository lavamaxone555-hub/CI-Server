import { describe, expect, it } from 'vitest'
import { applyLoyaltyDelta, assertCustomerTenant, loyaltyPointsForAmount, type Customer } from './customerCrm'

describe('customer CRM loyalty', () => {
 const customer: Customer={id:'c1',tenantId:'t1',name:'Max',active:true}
 it('isolates customer tenant',()=>expect(()=>assertCustomerTenant(customer,'t2')).toThrow())
 it('calculates points',()=>expect(loyaltyPointsForAmount(199.9,1)).toBe(199))
 it('prevents negative points',()=>expect(()=>applyLoyaltyDelta({customerId:'c1',tenantId:'t1',points:10},-11)).toThrow())
})

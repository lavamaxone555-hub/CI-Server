import{describe,expect,it}from'vitest'
import{assertRepairTenant,transitionRepair,validateTradeIn,warrantyActive,type RepairOrder}from'./repairWarranty'
describe('repair warranty trade-in',()=>{const o:RepairOrder={id:'r1',tenantId:'t1',branchId:'b1',status:'received',warrantyEndsAt:'2030-01-01T00:00:00Z'}
it('isolates tenant',()=>expect(()=>assertRepairTenant(o,'t2')).toThrow())
it('transitions repair',()=>expect(transitionRepair(o,'diagnosing').status).toBe('diagnosing'))
it('checks warranty',()=>expect(warrantyActive(o,new Date('2029-01-01'))).toBe(true))
it('rejects negative trade-in',()=>expect(()=>validateTradeIn({id:'q1',tenantId:'t1',productId:'p1',offeredAmount:-1,approved:false})).toThrow())})

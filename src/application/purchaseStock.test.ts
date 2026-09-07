import{describe,expect,it}from'vitest'
import{assertSupplierTenant,receiveStockTransfer,transitionPurchase,validateStockTransfer}from'./purchaseStock'
describe('purchase supplier stock transfer',()=>{it('isolates supplier tenant',()=>expect(()=>assertSupplierTenant({id:'s1',tenantId:'t1',name:'S',active:true},'t2')).toThrow())
it('closes received PO',()=>expect(()=>transitionPurchase({id:'p',tenantId:'t',branchId:'b',supplierId:'s',status:'received'},'approved')).toThrow())
it('rejects same branch transfer',()=>expect(()=>validateStockTransfer({id:'x',tenantId:'t',fromBranchId:'b',toBranchId:'b',status:'draft'})).toThrow())
it('receives in-transit transfer',()=>expect(receiveStockTransfer({id:'x',tenantId:'t',fromBranchId:'a',toBranchId:'b',status:'in_transit'}).status).toBe('received'))})
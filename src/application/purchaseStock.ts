export type Supplier={id:string;tenantId:string;name:string;active:boolean}
export type PurchaseOrder={id:string;tenantId:string;branchId:string;supplierId:string;status:'draft'|'approved'|'received'|'cancelled'}
export type StockTransfer={id:string;tenantId:string;fromBranchId:string;toBranchId:string;status:'draft'|'in_transit'|'received'|'cancelled'}

export function assertSupplierTenant(s:Supplier,tenantId:string){if(!s.active||s.tenantId!==tenantId)throw new Error('Supplier access denied')}
export function transitionPurchase(p:PurchaseOrder,next:PurchaseOrder['status']){if(['received','cancelled'].includes(p.status))throw new Error('Purchase order is closed');return {...p,status:next}}
export function validateStockTransfer(t:StockTransfer){if(t.fromBranchId===t.toBranchId)throw new Error('Source and destination branch must differ');return t}
export function receiveStockTransfer(t:StockTransfer){if(t.status!=='in_transit')throw new Error('Transfer is not in transit');return {...t,status:'received' as const}}

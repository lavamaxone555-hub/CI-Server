export type RepairStatus='received'|'diagnosing'|'waiting_parts'|'ready'|'delivered'|'cancelled'
export type RepairOrder={id:string;tenantId:string;branchId:string;customerId?:string;status:RepairStatus;warrantyEndsAt?:string}
export type TradeInQuote={id:string;tenantId:string;productId:string;offeredAmount:number;approved:boolean}

export function assertRepairTenant(order:RepairOrder,tenantId:string){if(order.tenantId!==tenantId)throw new Error('Repair tenant mismatch')}
export function transitionRepair(order:RepairOrder,next:RepairStatus){if(order.status==='delivered'||order.status==='cancelled')throw new Error('Repair is closed');return {...order,status:next}}
export function warrantyActive(order:RepairOrder,at=new Date()){return !!order.warrantyEndsAt&&new Date(order.warrantyEndsAt)>=at}
export function validateTradeIn(quote:TradeInQuote){if(quote.offeredAmount<0)throw new Error('Invalid trade-in amount');return quote}

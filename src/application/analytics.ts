export type SalesSnapshot={revenue:number;cost:number;expenses:number;orders:number;inventoryValue:number;lowStockCount:number}
export function grossProfit(s:SalesSnapshot){return s.revenue-s.cost}
export function netProfit(s:SalesSnapshot){return grossProfit(s)-s.expenses}
export function grossMarginPercent(s:SalesSnapshot){return s.revenue===0?0:Number(((grossProfit(s)/s.revenue)*100).toFixed(2))}
export function businessHealth(s:SalesSnapshot){const margin=grossMarginPercent(s);if(s.revenue<=0)return 'critical';if(netProfit(s)<0||s.lowStockCount>20)return 'at_risk';if(margin>=20&&s.lowStockCount<=5)return 'healthy';return 'watch'}

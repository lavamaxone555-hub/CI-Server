import{describe,expect,it}from'vitest'
import{businessHealth,grossMarginPercent,grossProfit,netProfit,type SalesSnapshot}from'./analytics'
const s:SalesSnapshot={revenue:1000,cost:600,expenses:100,orders:10,inventoryValue:5000,lowStockCount:2}
describe('analytics profit business health',()=>{it('calculates gross profit',()=>expect(grossProfit(s)).toBe(400));it('calculates net profit',()=>expect(netProfit(s)).toBe(300));it('calculates margin',()=>expect(grossMarginPercent(s)).toBe(40));it('returns health',()=>expect(businessHealth(s)).toBe('healthy'))})
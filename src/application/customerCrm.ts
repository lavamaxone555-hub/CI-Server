export type Customer = { id:string; tenantId:string; name:string; phone?:string; email?:string; active:boolean }
export type LoyaltyAccount = { customerId:string; tenantId:string; points:number }

export function assertCustomerTenant(customer: Customer, tenantId: string) {
  if (!customer.active || customer.tenantId !== tenantId) throw new Error('Customer access denied')
}
export function loyaltyPointsForAmount(amount: number, rate = 1) {
  if (amount < 0 || rate < 0) throw new Error('Invalid loyalty input')
  return Math.floor(amount * rate)
}
export function applyLoyaltyDelta(account: LoyaltyAccount, delta: number) {
  const points = account.points + delta
  if (points < 0) throw new Error('Insufficient loyalty points')
  return { ...account, points }
}

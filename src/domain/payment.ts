export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'qr'
export type Payment = { id: string; saleId: string; method: PaymentMethod; amount: number; reference?: string; status: 'pending' | 'paid' | 'void' }

const payments: Payment[] = []
export function recordPayment(input: Omit<Payment, 'id' | 'status'>) {
  if (input.amount <= 0) throw new Error('Payment amount must be greater than zero')
  const payment: Payment = { ...input, id: `pay_${Date.now()}_${payments.length}`, status: 'paid' }
  payments.push(payment)
  return payment
}
export function paymentsForSale(saleId: string) { return payments.filter(p => p.saleId === saleId) }

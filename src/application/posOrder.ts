export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'qr'
export type PaymentInput = { method: PaymentMethod; amount: number }
export type OrderLine = { productId: string; quantity: number; unitPrice: number }

export function calculateOrder(lines: readonly OrderLine[], discount = 0) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  if (discount < 0 || discount > subtotal) throw new Error('Invalid discount')
  return { subtotal, discount, total: subtotal - discount }
}

export function validatePayments(total: number, payments: readonly PaymentInput[]) {
  const paid = payments.reduce((sum, payment) => {
    if (payment.amount <= 0) throw new Error('Invalid payment amount')
    return sum + payment.amount
  }, 0)
  if (paid < total) throw new Error('Insufficient payment')
  return { paid, change: paid - total }
}

export function invoiceNumber(tenantCode: string, sequence: number) {
  if (!tenantCode || sequence < 1) throw new Error('Invalid invoice sequence')
  return `${tenantCode}-${String(sequence).padStart(8, '0')}`
}

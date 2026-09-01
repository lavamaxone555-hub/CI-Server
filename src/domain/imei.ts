export type ImeiStatus = 'in_stock' | 'sold' | 'returned' | 'repair'
export type ImeiUnit = { imei: string; productId: string; branchId: string; status: ImeiStatus }

const units = new Map<string, ImeiUnit>()
const validImei = (imei: string) => /^\d{15}$/.test(imei)

export function registerImei(input: ImeiUnit) {
  if (!validImei(input.imei)) throw new Error('IMEI must contain exactly 15 digits')
  if (units.has(input.imei)) throw new Error('IMEI already registered')
  units.set(input.imei, input)
  return input
}

export function getImei(imei: string) { return units.get(imei) }
export function setImeiStatus(imei: string, status: ImeiStatus) {
  const unit = units.get(imei)
  if (!unit) throw new Error('IMEI not found')
  if (status === 'sold' && unit.status !== 'in_stock') throw new Error('IMEI is not available for sale')
  unit.status = status
  return unit
}

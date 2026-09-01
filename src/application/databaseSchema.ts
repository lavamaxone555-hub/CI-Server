/** Database-neutral production schema for the retail persistence layer. */
export const retailSchema = {
  sales: {
    id: 'string primary key',
    tenantId: 'string indexed',
    branchId: 'string indexed',
    subtotal: 'number',
    discount: 'number',
    total: 'number',
    status: 'string',
  },
  inventoryMovements: {
    id: 'string primary key',
    productId: 'string indexed',
    branchId: 'string indexed',
    referenceId: 'string indexed',
    quantity: 'number',
    type: 'string',
  },
  payments: {
    id: 'string primary key',
    saleId: 'string indexed',
    amount: 'number',
    method: 'string',
    status: 'string',
  },
  imeiUnits: {
    imei: 'string primary key',
    productId: 'string indexed',
    branchId: 'string indexed',
    status: 'string indexed',
  },
} as const

export type RetailSchema = typeof retailSchema

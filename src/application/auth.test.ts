import { describe, expect, it } from 'vitest'
import { assertBranchAccess, assertTenantAccess, hasPermission, type AuthUser } from './auth'

const cashier: AuthUser = { id:'u1', tenantId:'t1', branchIds:['b1'], role:'cashier', active:true }

describe('auth RBAC and tenant isolation', () => {
  it('allows assigned permissions', () => expect(hasPermission(cashier,'sales:write')).toBe(true))
  it('denies unassigned permissions', () => expect(hasPermission(cashier,'purchase:write')).toBe(false))
  it('isolates tenants', () => {
    expect(() => assertTenantAccess(cashier,'t2')).toThrow('Tenant access denied')
    expect(() => assertTenantAccess(cashier,'t1')).not.toThrow()
  })
  it('isolates branches', () => {
    expect(() => assertBranchAccess(cashier,'b2')).toThrow('Branch access denied')
    expect(() => assertBranchAccess(cashier,'b1')).not.toThrow()
  })
})

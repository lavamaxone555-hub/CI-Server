export type Role = 'owner' | 'admin' | 'manager' | 'cashier' | 'technician' | 'viewer'

export type AuthUser = {
  id: string
  tenantId: string
  branchIds: string[]
  role: Role
  active: boolean
}

export const rolePermissions: Record<Role, readonly string[]> = {
  owner: ['*'],
  admin: ['*'],
  manager: ['dashboard:read','sales:read','sales:write','inventory:read','inventory:write','customer:read','customer:write','repair:read','repair:write','purchase:read','purchase:write'],
  cashier: ['sales:read','sales:write','customer:read','customer:write','inventory:read'],
  technician: ['repair:read','repair:write','inventory:read'],
  viewer: ['dashboard:read','sales:read','inventory:read','customer:read','repair:read','purchase:read'],
}

export function hasPermission(user: AuthUser, permission: string) {
  const permissions = rolePermissions[user.role]
  return user.active && (permissions.includes('*') || permissions.includes(permission))
}

export function assertTenantAccess(user: AuthUser, tenantId: string) {
  if (!user.active || user.tenantId !== tenantId) throw new Error('Tenant access denied')
}

export function assertBranchAccess(user: AuthUser, branchId: string) {
  if (!user.active || !user.branchIds.includes(branchId)) throw new Error('Branch access denied')
}

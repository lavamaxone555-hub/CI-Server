export type AuditEvent={id:string;tenantId:string;actorId?:string;action:string;resource:string;metadata:Record<string,unknown>;createdAt:string}
export type Notification={id:string;tenantId:string;channel:'in_app'|'email'|'webhook';message:string;read:boolean}

export function createAuditEvent(input:Omit<AuditEvent,'id'|'createdAt'>):AuditEvent{if(!input.tenantId||!input.action||!input.resource)throw new Error('Invalid audit event');return{...input,id:`${input.tenantId}-${input.action}`,createdAt:new Date().toISOString()}}
export function assertAuditTenant(event:AuditEvent,tenantId:string){if(event.tenantId!==tenantId)throw new Error('Audit tenant mismatch')}
export function createNotification(input:Omit<Notification,'id'|'read'>):Notification{if(!input.message.trim())throw new Error('Notification message required');return{...input,id:`${input.tenantId}-${Date.now()}`,read:false}}
export function markNotificationRead(n:Notification){return{...n,read:true}}

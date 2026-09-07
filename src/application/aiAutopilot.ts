export type AutopilotAction={id:string;tenantId:string;kind:'reorder'|'price_review'|'customer_followup';risk:'low'|'medium'|'high';payload:Record<string,unknown>}
export type ApprovalStatus='pending'|'approved'|'rejected'
export type Approval={actionId:string;tenantId:string;status:ApprovalStatus;approvedBy?:string}

export function requiresApproval(action:AutopilotAction){return action.risk!=='low'}
export function createApproval(action:AutopilotAction):Approval{return{actionId:action.id,tenantId:action.tenantId,status:requiresApproval(action)?'pending':'approved'}}
export function approve(a:Approval,userId:string){if(a.status!=='pending')throw new Error('Approval is closed');if(!userId)throw new Error('Approver required');return{...a,status:'approved' as const,approvedBy:userId}}
export function canExecute(action:AutopilotAction,a:Approval){if(action.tenantId!==a.tenantId||action.id!==a.actionId)throw new Error('Approval mismatch');return a.status==='approved'}

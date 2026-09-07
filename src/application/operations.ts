export type BackupJob={id:string;tenantId:string;status:'pending'|'running'|'completed'|'failed';createdAt:string}
export type HealthCheck={service:string;status:'healthy'|'degraded'|'down';checkedAt:string}
export function transitionBackup(job:BackupJob,next:BackupJob['status']){if(job.status==='completed')throw new Error('Backup already completed');return{...job,status:next}}
export function healthy(checks:readonly HealthCheck[]){return checks.length>0&&checks.every(c=>c.status==='healthy')}
export function assertOpsTenant(job:BackupJob,tenantId:string){if(job.tenantId!==tenantId)throw new Error('Ops tenant mismatch')}
export function backupEligible(job:BackupJob){return job.status==='pending'||job.status==='failed'}

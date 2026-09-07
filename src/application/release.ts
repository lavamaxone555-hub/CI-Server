export type Release={id:string;version:string;environment:'staging'|'production';status:'draft'|'approved'|'deployed'|'rolled_back';artifact:string}
export type Deployment={releaseId:string;environment:Release['environment'];health:'healthy'|'degraded'|'down'}
export function approveRelease(r:Release){if(r.status!=='draft')throw new Error('Release not draft');return{...r,status:'approved' as const}}
export function deployRelease(r:Release){if(r.status!=='approved')throw new Error('Release not approved');return{...r,status:'deployed' as const}}
export function canPromote(d:Deployment){return d.health==='healthy'}
export function rollbackRelease(r:Release){if(r.status!=='deployed')throw new Error('Release not deployed');return{...r,status:'rolled_back' as const}}

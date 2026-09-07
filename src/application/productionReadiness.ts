export type ReadinessCheck={name:string;passed:boolean;required:boolean}
export type ReadinessReport={ready:boolean;failed:string[]}
export function evaluateReadiness(checks:readonly ReadinessCheck[]):ReadinessReport{const failed=checks.filter(c=>c.required&&!c.passed).map(c=>c.name);return{ready:failed.length===0,failed}}
export function requireProductionReady(checks:readonly ReadinessCheck[]){const r=evaluateReadiness(checks);if(!r.ready)throw new Error('Production readiness failed: '+r.failed.join(','));return r}
export function smokeTest(checks:readonly ReadinessCheck[]){return evaluateReadiness(checks).ready}

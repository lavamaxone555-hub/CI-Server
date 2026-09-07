export type BusinessInsight={id:string;tenantId:string;kind:'forecast'|'alert'|'opportunity';message:string;confidence:number}
export type ForecastInput={history:readonly number[]}

export function forecastNext(input:ForecastInput){if(input.history.length===0)throw new Error('History required');const avg=input.history.reduce((a,b)=>a+b,0)/input.history.length;const trend=input.history.length<2?0:input.history[input.history.length-1]-input.history[0];return Math.max(0,Math.round((avg+trend/input.history.length)*100)/100)}
export function createInsight(tenantId:string,kind:BusinessInsight['kind'],message:string,confidence:number):BusinessInsight{if(confidence<0||confidence>1)throw new Error('Invalid confidence');return{id:`${tenantId}-${kind}`,tenantId,kind,message,confidence}}
export function assertInsightTenant(insight:BusinessInsight,tenantId:string){if(insight.tenantId!==tenantId)throw new Error('Insight tenant mismatch')}

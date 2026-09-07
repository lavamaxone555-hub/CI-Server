export type RateLimitWindow={key:string;limit:number;count:number;resetAt:number}
export function validateRequired(value:unknown,name:string){if(value===undefined||value===null||value==='')throw new Error(name+' is required');return value}
export function validateString(value:unknown,name:string,max=255){if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error('Invalid '+name);return value.trim()}
export function allowRateLimit(w:RateLimitWindow,now=Date.now()){if(now>=w.resetAt)return{...w,count:1,resetAt:now+60000};if(w.count>=w.limit)throw new Error('Rate limit exceeded');return{...w,count:w.count+1}}
export function assertTenantScope(resourceTenantId:string,requestTenantId:string){if(resourceTenantId!==requestTenantId)throw new Error('Tenant scope violation')}

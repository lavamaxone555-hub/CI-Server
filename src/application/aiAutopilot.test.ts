import{describe,expect,it}from'vitest'
import{approve,canExecute,createApproval,requiresApproval,type AutopilotAction}from'./aiAutopilot'
describe('AI autopilot approval',()=>{const low:AutopilotAction={id:'a1',tenantId:'t1',kind:'reorder',risk:'low',payload:{}};const high:AutopilotAction={...low,id:'a2',risk:'high'}
it('low risk auto approves',()=>expect(requiresApproval(low)).toBe(false))
it('high risk requires approval',()=>expect(createApproval(high).status).toBe('pending'))
it('approves pending action',()=>expect(canExecute(high,approve(createApproval(high),'u1'))).toBe(true))
it('rejects tenant mismatch',()=>expect(()=>canExecute(high,{actionId:'a2',tenantId:'t2',status:'approved'})).toThrow())})
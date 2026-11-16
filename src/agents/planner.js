const {z}=require('zod');
const names=['ask','extract_profile','retrieve_knowledge','parse_policy','calculate_gaps','plan_budget','compare_options','request_handoff','summarize','stop'];
const actionSchema=z.discriminatedUnion('action',names.map(action=>z.object({action:z.literal(action),input:z.record(z.string(),z.unknown()).default({})}).strict()));
function plan(session,readiness,riskLevel='LOW') { if(riskLevel==='HIGH')return actionSchema.parse({action:'request_handoff',input:{reasonCode:'HIGH_RISK'}}); if(session.intent!=='plan')return actionSchema.parse({action:'retrieve_knowledge'}); return actionSchema.parse({action:readiness.readiness==='DETAILED'?'calculate_gaps':'ask',input:readiness.nextQuestion||{}}); }
module.exports={plan,actionSchema,names};

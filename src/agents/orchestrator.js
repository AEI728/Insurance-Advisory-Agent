const {evaluate}=require('../domain/field-policy');
const {merge}=require('../domain/conflict');
const {parseMoney}=require('../domain/money');
const {risk}=require('../domain/safety');
const {plan}=require('./planner');
function extract(text,s) {
  const updates=[],members=[];
  if(s.mode==='family'){
    const relations=[['self',/(?:本人|我)\s*(\d{1,3})\s*岁/],['spouse',/(?:配偶|伴侣|丈夫|妻子)\s*(\d{1,3})\s*岁/],['child',/(?:孩子|儿子|女儿)\s*(\d{1,3})\s*岁/]];
    for(const [relation,re]of relations){const match=text.match(re);if(match){const existing=s.profile.members.find(m=>m.relation===relation),member_id=existing?.member_id||`m${relation}`;if(!existing)members.push({member_id,relation});updates.push({field:'age',memberId:member_id,value:Number(match[1])});}}
    for(const [relation,re]of [['self',/(?:本人|我)\s*(\d+(?:\.\d+)?)万(?!岁)/],['spouse',/(?:配偶|伴侣|丈夫|妻子)\s*(\d+(?:\.\d+)?)万(?!岁)/]]){const match=text.match(re);if(match){const existing=[...s.profile.members,...members].find(m=>m.relation===relation),member_id=existing?.member_id||`m${relation}`;if(!existing)members.push({member_id,relation});updates.push({field:'income_annual_fen',memberId:member_id,value:parseMoney(match[1]+'万/年').annual_fen});}}
  }
  const age=text.match(/(\d{1,3})\s*岁/);
  let memberId=s.profile.members[0]?.member_id;
  if(age&&s.mode==='individual') { memberId=memberId||'m1'; if(!s.profile.members.length)members.push({member_id:memberId,relation:/孩子|子女|儿子|女儿/.test(text)?'child':'self'}); updates.push({field:'age',value:Number(age[1]),memberId}); }
  const budget=text.match(/预算(?:每年|一年|年度|每月|每)?\s*(\d+(?:\.\d+)?\s*[万千百]?)(?:元)?\s*(\/月|\/年)?/);
  if(budget)updates.push({field:'annual_premium_budget_fen',value:parseMoney(budget[1]+(budget[2]||'/年')).annual_fen});
  const income=text.match(/(月|年)收入\s*(\d+(?:\.\d+)?\s*[万千百]?)/);
  if(income) { const money=parseMoney(income[2]+'/'+income[1]);updates.push({field:s.mode==='family'?'household_income_annual_fen':'income_annual_fen',value:money.annual_fen,...(s.mode==='individual'&&memberId?{memberId}:{}),normalization:money}); }
  return {members,updates:updates.map(u=>({...u,status:'known',source:'text_candidate'}))};
}
function view(s) { const e=evaluate(s); return {sessionId:s.id,mode:s.mode,intent:s.intent,state:s.state,revision:s.revision,profileSummary:s.profile,candidates:s.candidates,consents:s.consents,...e,modelMode:'mock',provenance:{mode:'mock',method:'deterministic_rules'},action:plan(s,e,s.riskLevel).action}; }
function updateSession(s,updates) {
 for(const u of updates)merge(s,u);
 if(s.mode==='family'){
  const household=s.profile.fields.household_income_annual_fen,incomes=s.profile.members.map(m=>s.profile.fields[`member:${m.member_id}:income_annual_fen`]);
  if(household?.status==='known'&&incomes.length>=2&&incomes.every(f=>f&&['known','none'].includes(f.status))){const sum=incomes.reduce((n,f)=>n+(f.value||0),0);if(sum!==household.value&&!s.conflicts.some(c=>c.key==='household_income_annual_fen'))s.conflicts.push({key:'household_income_annual_fen',values:[household.value,sum],statuses:['known','known'],reason:'member_income_sum_mismatch'});}
 }
 s.state='COLLECTING';const e=evaluate(s);if(!s.conflicts.length&&e.readiness!=='INSUFFICIENT')s.state='READY_'+e.readiness;
}
module.exports={extract,view,updateSession,risk};

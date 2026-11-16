const { AppError }=require('../api/errors');
const {keyOf}=require('./field-policy');
function budget(profile, total, fraction=1) {
  if (!Number.isSafeInteger(total)||total<0) throw new AppError('VALIDATION_ERROR');
  const get=(m,f)=>profile.fields[keyOf(f,m.member_id)]?.value;
  const weighted=profile.members.map(m=>({m,weight:1+(get(m,'dependency_role')==='primary'?2:0)+(Number(get(m,'income_annual_fen'))>0?1:0)}));
  const sum=weighted.reduce((n,x)=>n+x.weight,0), envelope=Math.floor(total*fraction);
  const allocations=weighted.map(({m,weight})=>({memberId:m.member_id, allocatedPremiumFen:Math.floor(envelope*weight/sum), kinds:m.relation==='child'?['medical','accident','critical_illness']:['medical','accident','term_life','critical_illness'], rationale:'按已确认收入角色分配预算信封，非费率或可购买承诺'}));
  return {name:fraction===1?'覆盖更完整':'先覆盖核心风险',allocations,total_fen:allocations.reduce((n,a)=>n+a.allocatedPremiumFen,0),unallocated_fen:total-allocations.reduce((n,a)=>n+a.allocatedPremiumFen,0)};
}
module.exports={budget};

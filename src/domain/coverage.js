const { AppError }=require('../api/errors');
function coverage(profile) {
  const ids=new Set();
  for(const p of profile.policies) { if(ids.has(p.policy_id)||!profile.members.some(m=>m.member_id===p.insured_member_id)) throw new AppError('INVALID_POLICY_OWNERSHIP',422); ids.add(p.policy_id); }
  return profile.members.map(m=>({memberId:m.member_id, confirmedLifeCoverageFen:profile.policies.filter(p=>p.insured_member_id===m.member_id&&p.kind==='term_life'&&p.validity==='valid'&&p.evidence_id).reduce((n,p)=>n+p.sum_insured_fen,0),
    gap:'qualitative', explanation:'责任年限、负债分摊、可用资产未确认，仅说明定性缺口，不估算精确保额。'}));
}
module.exports={coverage};

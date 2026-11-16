const globalFields = ['goals','region','annual_premium_budget_fen','essential_expense_annual_fen','liability_balance_fen'];
const memberFields = ['age','occupation_risk','dependency_role','income_annual_fen','responsibilities','social_insurance_status','existing_coverage_status'];
const weights = Object.fromEntries([...globalFields,...memberFields].map(f => [f, f === 'annual_premium_budget_fen' ? 3 : 1]));
const keyOf = (f, m) => m ? `member:${m}:${f}` : f;
const confirmed = f => f && ['known','none'].includes(f.status);
function evaluate(s) {
  const p = s.profile, missingFields = [];
  if ((s.mode === 'individual' && p.members.length !== 1) || (s.mode === 'family' && p.members.length < 2)) missingFields.push('members');
  const fields = [...globalFields];
  if (s.mode === 'family') fields.push('household_income_annual_fen');
  for (const f of fields) if (!confirmed(p.fields[f])) missingFields.push(f);
  for (const m of p.members) for (const f of memberFields) if (!confirmed(p.fields[keyOf(f,m.member_id)])) missingFields.push(keyOf(f,m.member_id));
  const preliminary = p.members.length > 0 && confirmed(p.fields.goals) && p.members.every(m=>confirmed(p.fields[keyOf('age',m.member_id)]));
  const readiness = missingFields.length === 0 && !s.conflicts.length ? 'DETAILED' : preliminary ? 'PRELIMINARY' : 'INSUFFICIENT';
  missingFields.sort((a,b)=>(weights[b.split(':').at(-1)]||1)-(weights[a.split(':').at(-1)]||1));
  const next = s.conflicts.length ? s.conflicts[0].key : missingFields[0];
  return { readiness, missingFields, conflicts:s.conflicts, allowedActions: readiness==='DETAILED' ? ['ask','analyze'] : ['ask',...(preliminary?['preliminary']:[])],
    nextQuestion: next ? { field:next, text: question(next), options: next.includes('status') ? ['有','无','未知'] : [] } : null,
    quality: [...fields,...p.members.flatMap(m=>memberFields.map(f=>keyOf(f,m.member_id)))].reduce((n,k)=>n+(confirmed(p.fields[k])?(weights[k.split(':').at(-1)]||1):0),0) / Math.max(1,[...fields,...p.members.flatMap(m=>memberFields.map(f=>keyOf(f,m.member_id)))].reduce((n,k)=>n+(weights[k.split(':').at(-1)]||1),0)) };
}
function question(key) { const name=key.split(':').at(-1); const names = { members:'请添加被保险人及关系：个人为一人，家庭至少两人。', goals:'最希望解决什么保障问题？',region:'常住地区？不确定可明确填写地区待核验。',annual_premium_budget_fen:'年度保费预算是多少？', essential_expense_annual_fen:'家庭每年必要支出约多少？',liability_balance_fen:'尚未偿还的重大负债？无负债请明确选择无。', household_income_annual_fen:'家庭年收入约多少？', age:'被保险人的年龄？', occupation_risk:'职业类别和工作风险？',dependency_role:'是主要收入者、共同收入者还是被抚养人？',income_annual_fen:'被保险人年收入？没有收入请选择无。',responsibilities:'需要承担哪些经济责任？没有请选择无。',social_insurance_status:'社会医保参保情况？',existing_coverage_status:'已有商业保险情况？' }; return `${key.startsWith('member:')?key.split(':')[1]+'：':''}${names[name]||'请确认冲突数值。'}`; }
module.exports = { evaluate, keyOf, confirmed, globalFields, memberFields, weights };

const { keyOf, globalFields, memberFields } = require('./field-policy');
const { AppError } = require('../api/errors');
function merge(s, u) {
  if(u.status==='none' && ['age','goals','region','annual_premium_budget_fen','essential_expense_annual_fen','occupation_risk','dependency_role'].includes(u.field)) throw new AppError('VALIDATION_ERROR',422,{},'该字段请填写数值或选择未知。');
  if (!(u.memberId ? memberFields : [...globalFields,'household_income_annual_fen']).includes(u.field)) throw new AppError('VALIDATION_ERROR');
  if (u.memberId && !s.profile.members.some(m=>m.member_id===u.memberId)) throw new AppError('VALIDATION_ERROR');
  if (u.status==='known' && (u.value===null || ['未知','不清楚','不知道'].includes(u.value))) u.status='unknown';
  if (u.status==='none') u.value=null;
  if (u.status==='known' && (u.field.endsWith('_fen') || u.field==='age') && (!Number.isSafeInteger(u.value) || u.value<0 || (u.field==='age' && u.value>120))) throw new AppError('VALIDATION_ERROR');
  const key=keyOf(u.field,u.memberId), old=s.profile.fields[key];
  if(u.normalization && (u.normalization.annual_fen!==u.normalization.amount_fen*(u.normalization.period==='month'?12:1)||u.value!==u.normalization.annual_fen))throw new AppError('VALIDATION_ERROR');
  if (old && old.status!=='unknown' && (old.value!==u.value || old.status!==u.status) && !u.resolveConflict) {
    s.conflicts=s.conflicts.filter(c=>c.key!==key); s.conflicts.push({key, values:[old.value,u.value], statuses:[old.status,u.status]}); return;
  }
  s.conflicts=s.conflicts.filter(c=>c.key!==key);
  s.profile.fields[key]={ value:u.status==='unknown'?null:u.value, status:u.status, source:'user_confirmation', confidence:1, confirmedAt:u.status==='unknown'?null:new Date().toISOString(), updatedAt:new Date().toISOString(),...(u.normalization?{normalization:u.normalization}:{}) };
}
module.exports={merge};

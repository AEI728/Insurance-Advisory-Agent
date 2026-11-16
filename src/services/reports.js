const {randomUUID}=require('node:crypto');
const {evaluate}=require('../domain/field-policy');
const {budget}=require('../domain/budget');
const {coverage}=require('../domain/coverage');
const {validateReport}=require('../domain/safety');
const {AppError}=require('../api/errors');
function makeReport(s,detail,evidence) {
  const e=evaluate(s);
  if(detail==='detailed'&&e.readiness!=='DETAILED'||detail==='preliminary'&&e.readiness==='INSUFFICIENT')throw new AppError('PROFILE_NOT_READY',409,e);
  if(s.riskLevel==='HIGH')throw new AppError('HUMAN_REVIEW_REQUIRED',409);
  if(detail==='detailed'&&evidence.evidenceStatus!=='sufficient')throw new AppError(evidence.conflict?'EVIDENCE_CONFLICT':'INSUFFICIENT_EVIDENCE',409,evidence);
  const total=s.profile.fields.annual_premium_budget_fen?.status==='known'?s.profile.fields.annual_premium_budget_fen.value:null;
  const r={reportId:randomUUID(),sessionId:s.id,revision:s.revision+1,generatedAt:new Date().toISOString(),detail,modelMode:'mock',expert_review_status:'not_done',members:s.profile.members,confirmedFields:s.profile.fields,unknowns:e.missingFields,
    budget_fen:total,scenarios:detail==='detailed'?[budget(s.profile,total,.7),budget(s.profile,total,1)]:[],coverage:coverage(s.profile),evidence,
    directions:['先核验社会医疗保障及已有商业保障','按各成员经济责任讨论医疗、意外、重疾与寿险方向'],
    warnings:['仅开发/受控演示，未完成专业审核','缺少实时费率；预算是上限情景，不能承诺可买到对应保障','投保条件、地区及合同责任须正式核验'],
    checklist:['确认被保险人及保单有效性','核验官方条款版本、保险责任、免责、等待期、续保和健康告知','向保险公司正式渠道核实核保及理赔条件'],comparisonDimensions:['责任范围','免责','等待期','续保','健康告知','现金价值'],comparisonStatus:'合同未提供时仅生成核验清单'};
  if(!validateReport(r))throw new AppError('REPORT_VALIDATION_FAILED',409);return r;
}
module.exports={makeReport};

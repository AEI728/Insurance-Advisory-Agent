const request=require('supertest');
const {createApp}=require('../src/api/app'),{loadConfig}=require('../src/config');
function setup(){process.env.NODE_ENV='test';const app=createApp({config:loadConfig({ADMIN_API_TOKEN:'test-admin-token'})});return {app,db:app.locals.db,api:request(app),close:()=>app.locals.db.close()};}
async function session(api,mode='individual',intent='plan'){return (await api.post('/api/v1/sessions').send({mode,intent,jurisdiction:'CN',privacyNoticeAccepted:true}).expect(201)).body;}
function completeUpdates(members){return [{field:'goals',value:'医疗和经济责任'},{field:'region',value:'上海'},{field:'annual_premium_budget_fen',value:800000},{field:'essential_expense_annual_fen',value:12000000},{field:'liability_balance_fen',value:null,status:'none'},...(members.length>1?[{field:'household_income_annual_fen',value:24000000}]:[]),...members.flatMap(m=>[
 {field:'age',value:m.relation==='child'?8:35,memberId:m.member_id},{field:'occupation_risk',value:'ordinary',memberId:m.member_id},{field:'dependency_role',value:m.relation==='child'?'dependent':'primary',memberId:m.member_id},
 {field:'income_annual_fen',value:m.relation==='self'?24000000:0,memberId:m.member_id},{field:'responsibilities',value:null,status:'none',memberId:m.member_id},{field:'social_insurance_status',value:'有',memberId:m.member_id},{field:'existing_coverage_status',value:null,status:'none',memberId:m.member_id}])];}
module.exports={setup,session,completeUpdates};

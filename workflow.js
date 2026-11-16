'use strict';
const $=s=>document.querySelector(s);
let session=null,accessToken='',report=null,busy=false;
const labels={goals:'保障目标',region:'常住地区',annual_premium_budget_fen:'年度保费预算',essential_expense_annual_fen:'每年必要支出',liability_balance_fen:'负债余额',household_income_annual_fen:'家庭年收入',age:'年龄',occupation_risk:'职业风险',dependency_role:'经济角色',income_annual_fen:'年收入',responsibilities:'经济责任',social_insurance_status:'社保',existing_coverage_status:'已有商业保障'};
const relations={self:'本人',spouse:'配偶',child:'孩子',parent:'父母',other:'其他保障对象'};
const states={COLLECTING:'信息采集中',READY_PRELIMINARY:'可提供初步建议',READY_DETAILED:'可生成详细情景',REPORT_READY:'报告已生成',PAUSED:'已暂停',COMPLETED:'已完成',USER_ENDED:'已结束',HUMAN_REVIEW_REQUIRED:'需要专业核验'};
function memberName(id){const m=session?.profileSummary.members.find(m=>m.member_id===id);return m?(relations[m.relation]||m.relation)+'（'+(session.profileSummary.members.indexOf(m)+1)+'）':'家庭';}
function fieldName(key){const p=key.split(':');return (p.length===3?memberName(p[1])+' · ':'')+(labels[p.at(-1)]||key);}
function showReport(){if(!report)return;$('#report').textContent=JSON.stringify(report,null,2);const box=$('#reportReadable');box.replaceChildren(node('h3',report.detail==='detailed'?'保障预算情景':'初步保障方向'));if(report.status==='superseded')box.append(node('p','资料已修改：此报告已失效，请重新生成。','notice'));for(const direction of report.directions||[])box.append(node('p',direction));for(const scenario of report.scenarios||[]){box.append(node('h3',scenario.name),node('p','预算分配合计 '+scenario.total_fen/100+' 元 / 年'));for(const a of scenario.allocations)box.append(node('p',memberName(a.memberId)+'：年度预算上限 '+a.allocatedPremiumFen/100+' 元'));}for(const warning of report.warnings||[])box.append(node('p',warning,'notice'));box.append(node('h3','投保前核验'));for(const item of report.checklist||[])box.append(node('p',item));box.append(node('h3','依据与不确定性'));for(const d of report.evidence?.results||[])box.append(node('p',(d.synthetic?'合成演示 · ':'')+d.title+' · '+d.source_uri));if(!report.evidence?.results.length)box.append(node('p','暂无适用审核证据；仅提供方向性说明。'));}
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,fn){const b=node('button',text,'secondary-button');b.type='button';b.addEventListener('click',()=>run(fn));return b;}
async function request(route,method='GET',body){const headers={Authorization:'Bearer '+accessToken};if(body)headers['Content-Type']='application/json';const response=await fetch('/api/v1/'+route,{method,headers,body:body?JSON.stringify(body):undefined});if(response.status===204)return null;const data=await response.json();if(!response.ok)throw Error(data.error.code+'：'+data.error.message);return data;}
async function run(fn){if(busy)return;busy=true;$('#error').textContent='';try{await fn();}catch(e){$('#error').textContent=e.message;}finally{busy=false;}}
function remember(){sessionStorage.setItem('xia oan-session',JSON.stringify({id:session.sessionId,accessToken}));}
async function mutate(suffix,body,method='POST'){session=await request('sessions/'+session.sessionId+suffix,method,{expectedRevision:session.revision,...body});remember();render();}
function render(){
 $('#entry').hidden=!!session;$('#consult').hidden=!session;if(!session)return;
 $('#external').checked=Boolean(session.consents?.external_llm?.granted);
 if(session.intent==='compare'&&!$('#compareForm')){
  const form=node('section');form.id='compareForm';form.append(node('h2','指定版本的条款对比'));
  for(const suffix of ['A','B'])for(const [key,title]of [['Product','产品标识'],['Version','合同版本']]){const label=node('label',`候选${suffix} · ${title} `),input=node('input');input.id='compare'+key+suffix;label.append(input);form.append(label);}
  const select=node('select');select.id='compareDimension';for(const [value,title]of [['renewal_period','保证续保期间'],['waiting_period','等待期'],['exclusions','免责责任'],['cash_value','现金价值']]){const option=node('option',title);option.value=value;select.append(option);}form.append(select);
  form.append(button('核验并比较',async()=>{const options=['A','B'].map(x=>({productId:$('#compareProduct'+x).value,version:$('#compareVersion'+x).value}));await mutate('/compare',{options,dimensions:[$('#compareDimension').value]});}));
  const result=node('div');result.id='compareResult';form.append(result);$('#consult').prepend(form);
 }
 if($('#compareForm'))$('#compareForm').hidden=session.intent!=='compare';
 if(session.comparison&&$('#compareResult')){const box=$('#compareResult');box.replaceChildren(node('p',session.comparison.warning));for(const row of session.comparison.rows)for(const o of row.options)box.append(node('p',`${o.productId}（${o.version}）：${o.value}；依据：${o.sources.map(s=>s.doc_id).join('、')}`));}
 $('#status').textContent=`${session.mode==='individual'?'个人 · 一名被保险人':'家庭规划'} · ${states[session.state]||session.state} · ${session.provenance?.mode&&session.provenance.mode!=='mock'?'模型辅助解释':'离线演示'}`;
 $('#status').dataset.state=session.state;
 $('#next').textContent=session.intent==='plan'?(session.nextQuestion?.text||'画像已满足详细分析门槛，可生成情景报告。'):'可直接提问，无需补齐规划画像；比较具体条款时请提供准确的产品、版本及待比较事实。';
 $('#profile').replaceChildren();
 for(const m of session.profileSummary.members)$('#profile').append(node('p',memberName(m.member_id)));
 for(const [key,f]of Object.entries(session.profileSummary.fields)){
  const row=node('div',undefined,'field-row'),display=f.status==='unknown'?'未知':f.status==='none'?'无':key.endsWith('_fen')?(f.value/100)+'元':String(f.value);
  row.append(node('span',`${fieldName(key)}：${display}`));
  row.append(button('修改',async()=>{const value=prompt('新值（金钱字段填元）',key.endsWith('_fen')?String((f.value||0)/100):String(f.value||''));if(value===null)return;const p=key.split(':'),field=p.at(-1);await mutate('/profile',{updates:[{field,memberId:p.length===3?p[1]:undefined,value:field.endsWith('_fen')?Math.round(Number(value)*100):field==='age'?Number(value):value,resolveConflict:true}]},'PATCH');report=null;}));$('#profile').append(row);
 }
 $('#missing').textContent=session.missingFields.map(fieldName).join('、')||'无';$('#conflicts').replaceChildren();
 for(const c of session.conflicts){const row=node('p',`冲突 ${fieldName(c.key)}：${c.values.map(v=>c.key.endsWith('_fen')?v/100+'元':String(v)).join(' / ')} `);row.dataset.field=c.key;c.values.forEach((v,i)=>{const b=button('确认 '+String(v),async()=>{const p=c.key.split(':');await mutate('/profile',{updates:[{field:p.at(-1),memberId:p.length===3?p[1]:undefined,value:v,status:c.statuses?.[i]||'known',resolveConflict:true}]},'PATCH');});b.textContent='采用 '+(c.key.endsWith('_fen')?v/100+'元':String(v));b.dataset.value=String(v);row.append(b);});$('#conflicts').append(row);}
 $('#candidates').replaceChildren();const candidates=session.candidates;
 if(candidates?.updates?.length||candidates?.members?.length){for(const m of candidates.members||[])$('#candidates').append(node('p','新增保障对象：'+relations[m.relation]));for(const u of candidates.updates||[])$('#candidates').append(node('p',(labels[u.field]||u.field)+'：'+(u.field.endsWith('_fen')?u.value/100+'元':u.value)));$('#candidates').append(button('确认候选信息',async()=>{await mutate('/profile',{members:candidates.members.length?[...session.profileSummary.members,...candidates.members]:undefined,updates:candidates.updates.map(({field,value,memberId,status,normalization})=>({field,value,memberId,status,normalization}))},'PATCH');}));}
 $('#fieldForm').hidden=session.intent!=='plan'||session.nextQuestion?.field==='members'||!session.nextQuestion;
 $('#answerValue').type=session.nextQuestion?.field.endsWith('_fen')||session.nextQuestion?.field.endsWith(':age')?'number':'text';
 $('#answerValue').placeholder=session.nextQuestion?.field.endsWith('_fen')?'请填写元，例如 8000':'填写回答，也可选择无或未知';
 if(session.report){report=session.report;$('#report').textContent=JSON.stringify(report,null,2);$('#reportPanel').hidden=false;}
 else if(report&&report.revision!==session.revision){report={...report,status:'superseded'};}
 showReport();
}
$('#start').addEventListener('click',()=>run(async()=>{if(!$('#privacyAccept').checked)throw Error('请先阅读并接受隐私说明');session=await request('sessions','POST',{mode:$('#mode').value,intent:$('#intent').value,jurisdiction:'CN',privacyNoticeAccepted:true});accessToken=session.accessToken;remember();render();}));
$('#addMember').addEventListener('click',()=>run(async()=>{const members=[...session.profileSummary.members,{member_id:'m'+(Date.now()),relation:$('#relation').value}];await mutate('/profile',{members},'PATCH');}));
$('#send').addEventListener('click',()=>run(async()=>{const text=$('#message').value;await mutate('/messages',{text});$('#reply').textContent=session.assistantMessage;$('#message').value='';}));
async function answer(status){const key=session.nextQuestion?.field;if(!key||key==='members')throw Error('请先添加保障对象');const p=key.split(':'),field=p.at(-1),raw=$('#answerValue').value;let value=status==='known'?(field.endsWith('_fen')?Math.round(Number(raw)*100):field==='age'?Number(raw):raw):null;if(status==='known'&&!raw.trim())throw Error('请输入内容');await mutate('/profile',{updates:[{field,memberId:p.length===3?p[1]:undefined,value,status}]},'PATCH');$('#answerValue').value='';}
for(const status of ['known','none','unknown'])$('#answer-'+status).addEventListener('click',()=>run(()=>answer(status)));
for(const detail of ['preliminary','detailed'])$('#'+detail).addEventListener('click',()=>run(()=>mutate('/analyze',{detail})));
for(const reason of ['pause','resume','complete','user_end'])$('#'+reason).addEventListener('click',()=>run(()=>mutate('/close',{reason})));
$('#handoff').addEventListener('click',()=>run(async()=>{if(!$('#handoffConsent').checked)throw Error('请先同意共享最小摘要');const t=await request('sessions/'+session.sessionId+'/handoffs','POST',{expectedRevision:session.revision,reasonCode:'USER_REQUEST',consentToShareSummary:true,idempotencyKey:'ui-request'});$('#reply').textContent=t.status+'：'+t.message;session=await request('sessions/'+session.sessionId);render();}));
$('#external').addEventListener('change',()=>run(()=>mutate('/consents',{purpose:'external_llm',granted:$('#external').checked,noticeVersion:'v1'})));
$('#delete').addEventListener('click',()=>run(async()=>{await request('sessions/'+session.sessionId,'DELETE',{expectedRevision:session.revision});session=null;accessToken='';report=null;sessionStorage.removeItem('xia oan-session');$('#report').textContent='';$('#reportPanel').hidden=true;render();}));
$('#switchMode').addEventListener('click',()=>run(()=>mutate('/profile',{mode:session.mode==='individual'?'family':'individual'},'PATCH')));
$('#upload').addEventListener('change',()=>run(async()=>{const form=new FormData();form.append('expectedRevision',String(session.revision));form.append('file',$('#upload').files[0]);const r=await fetch('/api/v1/sessions/'+session.sessionId+'/attachments',{method:'POST',headers:{Authorization:'Bearer '+accessToken},body:form});const data=await r.json();if(!r.ok)throw Error(data.error.code);session=data;$('#reply').textContent=JSON.stringify(data.attachment,null,2);render();}));
for(const format of ['json','txt'])$('#export-'+format).addEventListener('click',()=>run(async()=>{if(!report)throw Error('尚未生成报告');const r=await fetch('/api/v1/reports/'+report.reportId+'/export?format='+format,{headers:{Authorization:'Bearer '+accessToken}});if(!r.ok)throw Error('报告不可访问');const url=URL.createObjectURL(await r.blob()),a=node('a');a.href=url;a.download='insurance-report.'+format;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
run(async()=>{const stored=sessionStorage.getItem('xia oan-session');if(stored){const s=JSON.parse(stored);accessToken=s.accessToken;try{session=await request('sessions/'+s.id);}catch{sessionStorage.removeItem('xia oan-session');}}render();});

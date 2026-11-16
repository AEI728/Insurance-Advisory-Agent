process.env.NODE_ENV='test';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {setup,session}=require('../tests/helpers'),{ingest}=require('../src/knowledge/ingest'),{retrieve}=require('../src/knowledge/retrieve');
async function main(){const {api,db,close}=setup(),results=[],dir='tests/fixtures',hash=crypto.createHash('sha256');const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
try{
 for(const f of ['sessions.jsonl','retrieval.jsonl','knowledge.json'])hash.update(fs.readFileSync(path.join(dir,f)));
 const rows=f=>fs.readFileSync(path.join(dir,f),'utf8').trim().split('\n').map(JSON.parse);
 for(const c of rows('sessions.jsonl')){let actual=null;const start=Date.now();const harness=setup();try{const api=harness.api;const s=await session(api,c.mode,c.intent),p='/api/v1/sessions/'+s.sessionId,h={Authorization:'Bearer '+s.accessToken};let revision=0;
  for(const turn of c.turns){const r=await api.post(p+'/messages').set(h).send({...turn,expectedRevision:revision});assert.equal(r.status,200);actual=r.body;revision=actual.revision;}
  assert.equal(actual.readiness,c.expected.readiness);if(c.expected.state)assert.equal(actual.state,c.expected.state);
  const candidates=actual.candidates?.updates||[];
  for(const [expectedKey,field] of [['budget_annual_fen','annual_premium_budget_fen'],['income_annual_fen','income_annual_fen'],['age','age']])if(c.expected[expectedKey]!==undefined)assert.equal(candidates.find(u=>u.field===field)?.value,c.expected[expectedKey]);
  if(c.expected.insured_relation)assert.equal(actual.candidates.members[0].relation,c.expected.insured_relation);
  if(c.expected.conflict_field)assert.ok(actual.conflicts.some(x=>x.key===c.expected.conflict_field));
  if(c.expected.unknown_budget)assert.equal(actual.profileSummary.fields.annual_premium_budget_fen.status,'unknown');
  const guard=await api.post(p+'/analyze').set(h).send({detail:'detailed',expectedRevision:revision});assert.equal(guard.status,409);assert.equal(guard.body.error.code,'PROFILE_NOT_READY');
  results.push({case_id:c.case_id,group:'consultation',split:c.split,pass:true,expected:c.expected,actual:{state:actual.state,action:actual.action,readiness:actual.readiness},durationMs:Date.now()-start});
 }catch(e){results.push({case_id:c.case_id,group:'consultation',pass:false,expected:c.expected,actual,error_category:e.message,durationMs:Date.now()-start});}finally{harness.close();}}
 for(const d of require('../tests/fixtures/knowledge.json'))ingest(db,d,{syntheticApproval:true});
 for(const c of rows('retrieval.jsonl')){const actual=retrieve(db,c.query,{productId:c.product_id,version:c.clause_version,requiredFacts:c.must_contain_fact_ids});let pass=actual.evidenceStatus===c.expected_status&&c.gold_doc_ids.every(id=>actual.results.some(r=>r.doc_id===id));const found=c.gold_doc_ids.filter(id=>actual.results.some(r=>r.doc_id===id)).length;results.push({case_id:c.case_id,group:'retrieval',pass,expected:c.expected_status,actual:actual.evidenceStatus,gold_count:c.gold_doc_ids.length,found,recall:c.gold_doc_ids.length?found/c.gold_doc_ids.length:null,error_category:pass?null:'EVIDENCE_MISMATCH'});}
 const out='artifacts/eval';fs.mkdirSync(out,{recursive:true});const retrieval=results.filter(x=>x.recall!==undefined&&x.recall!==null),summary={code_sha:sha,working_tree:'uncommitted implementation',dataset_hash:hash.digest('hex'),modelMode:'mock',expert_review_status:'not_done',count:results.length,passed:results.filter(r=>r.pass).length,recall_at_4:retrieval.reduce((n,r)=>n+r.recall,0)/retrieval.length,recall_queries:retrieval.length,results};
 fs.writeFileSync(out+'/results.json',JSON.stringify(summary,null,2));fs.writeFileSync(out+'/results.csv','case_id,group,pass,actual\n'+results.map(r=>[r.case_id,r.group,r.pass,JSON.stringify(r.actual).replace(/,/g,';')].join(',')).join('\n'));fs.writeFileSync(out+'/failures.jsonl',results.filter(r=>!r.pass).map(r=>JSON.stringify({...r,code_sha:sha})).join('\n'));console.log(JSON.stringify({count:summary.count,passed:summary.passed,recall_at_4:summary.recall_at_4}));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});

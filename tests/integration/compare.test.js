const {test}=require('node:test'),assert=require('node:assert/strict');
const {setup,session}=require('../helpers'),{ingest}=require('../../src/knowledge/ingest');
test('specified approved contract versions compare fact values; missing evidence blocks',async t=>{
 const {api,db,close}=setup();t.after(close);const s=await session(api,'individual','compare'),p='/api/v1/sessions/'+s.sessionId,h={Authorization:'Bearer '+s.accessToken};
 const a=require('../fixtures/knowledge.json')[1],b={...a,id:'SYN-SECOND',product_id:'SYN-SECOND',fact_values:{renewal_period:'5年'}};
 for(const d of [a,b])ingest(db,d,{syntheticApproval:true});
 const input={expectedRevision:0,options:[{productId:a.product_id,version:a.clause_version,query:'保证续保'},{productId:b.product_id,version:b.clause_version,query:'保证续保'}],dimensions:['renewal_period']};
 const r=await api.post(p+'/compare').set(h).send(input).expect(200);assert.equal(r.body.comparison.rows[0].options[0].value,'1年');assert.equal(r.body.comparison.rows[0].options[1].value,'5年');
 await api.post(p+'/compare').set(h).send({...input,expectedRevision:1,dimensions:['exclusions']}).expect(409);
});

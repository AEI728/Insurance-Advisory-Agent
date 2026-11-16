const assert=require('node:assert/strict');
const {createApp}=require('../src/api/app'),{loadConfig}=require('../src/config');
const app=createApp({config:loadConfig({})}),server=app.listen(0,'127.0.0.1',async()=>{
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(p,method='GET',body,token)=>{const r=await fetch(base+p,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:r.status===204?null:await r.json()};};
 try{assert.equal((await call('/api/health')).status,200);const c=await call('/api/v1/sessions','POST',{mode:'individual',intent:'plan',jurisdiction:'CN',privacyNoticeAccepted:true});assert.equal(c.status,201);const s=c.body,p='/api/v1/sessions/'+s.sessionId,t=s.accessToken;
 assert.equal((await call(p)).status,401);assert.equal((await call(p,'GET',undefined,'wrong')).status,401);
 const a=await call(p+'/analyze','POST',{detail:'detailed',expectedRevision:0},t);assert.equal(a.status,409);assert.equal(a.body.error.code,'PROFILE_NOT_READY');
 const u=await call(p+'/profile','PATCH',{expectedRevision:0,updates:[{field:'goals',value:'医疗'}]},t);assert.equal(u.body.revision,1);assert.equal((await call(p+'/profile','PATCH',{expectedRevision:0,updates:[]},t)).status,409);
 assert.equal((await call('/api/v1/knowledge/search?q=保障')).body.evidenceStatus,'insufficient');
 const h=await call(p+'/handoffs','POST',{expectedRevision:1,reasonCode:'USER_REQUEST',consentToShareSummary:true,idempotencyKey:'smoke'},t);assert.equal(h.body.status,'PENDING_UNASSIGNED');
 assert.equal((await call(p,'DELETE',{expectedRevision:2},t)).status,204);assert.equal((await call(p,'GET',undefined,t)).status,401);console.log('HTTP smoke passed');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();app.locals.db.close();}
});

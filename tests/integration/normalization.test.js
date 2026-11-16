const {test}=require('node:test'),assert=require('node:assert/strict');
const {setup,session}=require('../helpers');
test('monthly income confirmation preserves period and original amount, tampering rejected',async t=>{const {api,close}=setup();t.after(close);const s=await session(api),p='/api/v1/sessions/'+s.sessionId,h={Authorization:'Bearer '+s.accessToken};
 await api.patch(p+'/profile').set(h).send({expectedRevision:0,members:[{member_id:'m',relation:'self'}],updates:[]}).expect(200);
 const normalization={amount_fen:2000000,period:'month',annual_fen:24000000};const r=await api.patch(p+'/profile').set(h).send({expectedRevision:1,updates:[{field:'income_annual_fen',memberId:'m',value:24000000,normalization}]}).expect(200);assert.deepEqual(r.body.profileSummary.fields['member:m:income_annual_fen'].normalization,normalization);
 await api.patch(p+'/profile').set(h).send({expectedRevision:2,updates:[{field:'income_annual_fen',memberId:'m',value:120,normalization}]}).expect(422);
});

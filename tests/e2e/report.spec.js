const {test,expect}=require('@playwright/test');
const {completeUpdates}=require('../helpers');
test('family detailed budget report is superseded after confirmed budget edit',async({page,request})=>{
 const admin={Authorization:'Bearer e2e-local-admin'},doc=require('../fixtures/knowledge.json')[0];
 let r=await request.post('/api/v1/admin/knowledge/import',{headers:admin,data:doc});expect(r.status()).toBe(201);
 r=await request.post('/api/v1/admin/knowledge/'+doc.id+'/review',{headers:admin,data:{decision:'approved',reviewer:'synthetic e2e reviewer',evidence:'synthetic fixture, not professional approval'}});expect(r.status()).toBe(200);
 await page.goto('/');await page.selectOption('#mode','family');await page.check('#privacyAccept');await page.click('#start');await expect(page.locator('#consult')).toBeVisible();
 const stored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('xia oan-session'))),headers={Authorization:'Bearer '+stored.accessToken};
 const members=[{member_id:'self',relation:'self'},{member_id:'spouse',relation:'spouse'},{member_id:'child',relation:'child'}];
 r=await request.patch('/api/v1/sessions/'+stored.id+'/profile',{headers,data:{expectedRevision:0,members,updates:completeUpdates(members)}});expect(r.status()).toBe(200);
 await page.reload();await page.click('#detailed');await expect(page.locator('#report')).toContainText('覆盖更完整');
 const report=JSON.parse(await page.locator('#report').textContent());expect(report.scenarios.every(s=>s.total_fen<=800000)).toBeTruthy();
 await page.fill('#message','预算5000元/年');await page.click('#send');await page.getByRole('button',{name:'确认候选信息'}).click();await expect(page.locator('#conflicts')).toContainText('年度保费预算');await page.getByRole('button',{name:'采用 5000元',exact:true}).click();await page.click('#detailed');await expect(page.locator('#report')).toContainText('500000');
 const old=await request.get('/api/v1/reports/'+report.reportId,{headers});expect((await old.json()).status).toBe('superseded');await page.screenshot({path:'artifacts/screenshots/detailed-report.png',fullPage:true});
});

const {z}=require('zod');
const {tokenize}=require('./tokenize');
const {hash}=require('../db/connection');
const documentSchema=z.object({ id:z.string().min(1).max(150),title:z.string().min(1).max(300),content:z.string().min(1).max(200000),layer:z.enum(['concepts','rules','clauses']),
  source_uri:z.string().min(1), source_type:z.string().default('user_provided'),jurisdiction:z.literal('CN').default('CN'),product_id:z.string().nullable().default(null),clause_version:z.string().nullable().default(null),valid_from:z.string().date().default('2026-01-01'), valid_to:z.string().date().nullable().default(null),
  fact_ids:z.array(z.string()).default([]),fact_values:z.record(z.string(),z.string()).default({}),synthetic:z.boolean().default(false) }).strict().superRefine((d,c)=>{if(d.layer==='clauses'&&(!d.product_id||!d.clause_version))c.addIssue({code:'custom',message:'clauses require product_id and clause_version'});});
function chunks(d) {
  const result=[];
  const sections=d.content.split(/(?=第[一二三四五六七八九十百\d]+条)/);
  for(let n=0;n<sections.length;n++) {
    const text=sections[n],parent=`${d.id}:section:${n}`,clause_no=text.match(/^第[^条\n]{1,12}条/)?.[0]||null;
    for(let start=0;start<text.length;start+=1020)result.push({chunk_id:`${parent}:${start}`,parent_id:parent,section:n,clause_no,page:null,text:text.slice(start,start+1200),parent_text:text});
  }
  return result;
}
function ingest(db,input,options={}) {
  const d=documentSchema.parse(input); d.content_hash=hash(d.content); d.review_status='pending'; d.reviewed_by=null;d.reviewed_at=null;
  if(options.syntheticApproval) { if(!(process.env.NODE_ENV==='test'||(process.env.NODE_ENV==='development'&&process.env.ENABLE_DEMO_KNOWLEDGE==='true'))||!d.synthetic||!d.id.startsWith('SYN-')) throw new Error('Synthetic approval forbidden'); d.review_status='approved';d.reviewed_by='synthetic-fixture';d.reviewed_at=new Date().toISOString(); }
  db.transaction(()=>{
    const old=db.prepare('SELECT id FROM knowledge_chunks WHERE doc_id=?').all(d.id);
    for(const row of old)db.prepare('DELETE FROM knowledge_fts WHERE chunk_id=?').run(row.id);
    db.prepare('DELETE FROM knowledge_documents WHERE id=?').run(d.id);
    db.prepare('INSERT INTO knowledge_documents VALUES (?,?)').run(d.id,JSON.stringify(d));
    for(const c of chunks(d)) { db.prepare('INSERT INTO knowledge_chunks VALUES (?,?,?)').run(c.chunk_id,d.id,JSON.stringify(c)); db.prepare('INSERT INTO knowledge_fts VALUES (?,?)').run(c.chunk_id,tokenize(d.title+' '+c.text).join(' ')); }
  })();return d;
}
function review(db,id,{decision,reviewer,evidence}) { const r=db.prepare('SELECT payload FROM knowledge_documents WHERE id=?').get(id); if(!r) return null; const d=JSON.parse(r.payload); Object.assign(d,{review_status:decision,reviewed_by:reviewer,review_evidence:evidence,reviewed_at:new Date().toISOString()}); db.prepare('UPDATE knowledge_documents SET payload=? WHERE id=?').run(JSON.stringify(d),id);return d; }
module.exports={ingest,review,chunks,documentSchema};

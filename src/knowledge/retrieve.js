const {tokenize}=require('./tokenize');
function retrieve(db,query,{layer,productId,version,jurisdiction='CN',requiredFacts=[],topK=4,date=new Date().toISOString().slice(0,10)}={}) {
  const tokens=tokenize(query).slice(0,80), docs=new Map(db.prepare('SELECT * FROM knowledge_documents').all().map(r=>[r.id,JSON.parse(r.payload)]));
  const rows=tokens.length?db.prepare('SELECT c.payload,c.doc_id,bm25(knowledge_fts) rank FROM knowledge_fts JOIN knowledge_chunks c ON c.id=knowledge_fts.chunk_id WHERE knowledge_fts MATCH ? ORDER BY rank,c.id').all(tokens.map(t=>'"'+t.replace(/"/g,'')+'"').join(' OR ')):[];
  const seen=new Set(),all=[];
  for(const row of rows) { const d=docs.get(row.doc_id); if(seen.has(d.id)||d.review_status!=='approved'||d.jurisdiction!==jurisdiction||(layer&&d.layer!==layer)||(productId&&d.product_id!==productId)||(version&&d.clause_version!==version)||d.valid_from>date||(d.valid_to&&d.valid_to<date))continue;
    seen.add(d.id); const c=JSON.parse(row.payload); all.push({doc_id:d.id,title:d.title,layer:d.layer,source_uri:d.source_uri,source_type:d.source_type,product_id:d.product_id,clause_version:d.clause_version,review_status:d.review_status,synthetic:d.synthetic,fact_ids:d.fact_ids,fact_values:d.fact_values,chunk_id:c.chunk_id,clause_no:c.clause_no,page:c.page,text:c.parent_text,rank:row.rank}); }
  const claims=new Map(); let conflict=false;
  for(const d of all)for(const [fact,val] of Object.entries(d.fact_values)) { const key=[d.product_id,d.clause_version,fact].join(':'); if(claims.has(key)&&claims.get(key)!==val)conflict=true; claims.set(key,val); }
  const versions=new Set(all.filter(d=>d.layer==='clauses').map(d=>d.clause_version));
  if(!version&&versions.size>1)conflict=true;
  const results=all.slice(0,topK), coveredFacts=[...new Set(results.flatMap(d=>d.fact_ids))], missingFacts=requiredFacts.filter(f=>!coveredFacts.includes(f));
  const versionMatch=results.every(d=>d.layer!=='clauses'||Boolean(productId&&version&&d.product_id===productId&&d.clause_version===version));
  let contextChars=0;const contextComplete=results.every(d=>{contextChars+=d.text.length;return d.text.length<=8000&&contextChars<=16000;});
  if(!contextComplete)for(const d of results)d.text=d.text.slice(0,Math.floor(16000/Math.max(1,results.length)));
  const evidenceStatus=conflict?'conflicted':!results.length?'insufficient':missingFacts.length||!versionMatch||!contextComplete?'partial':'sufficient';
  return {results,evidenceStatus,requiredFacts,coveredFacts,missingFacts,sourceEligible:results.length>0,versionMatch,conflict,nextAction:conflict?'request_review':evidenceStatus==='sufficient'?'use_evidence':'request_contract_version',backend:'lexical'};
}
module.exports={retrieve};

const {retrieve}=require('../knowledge/retrieve');
const {AppError}=require('../api/errors');
function compareOptions(db,options,dimensions){
 const evidence=options.map(o=>retrieve(db,o.query||'条款 保险 责任 等待 续保 免责 保证',{productId:o.productId,version:o.version,layer:'clauses',requiredFacts:dimensions,topK:4}));
 for(const e of evidence)if(e.evidenceStatus!=='sufficient')throw new AppError(e.conflict?'EVIDENCE_CONFLICT':'INSUFFICIENT_EVIDENCE',409,e);
 const rows=dimensions.map(dimension=>({dimension,options:options.map((o,i)=>{
   const sources=evidence[i].results.filter(d=>d.fact_ids.includes(dimension));
   const values=[...new Set(sources.map(d=>d.fact_values[dimension]).filter(Boolean))];
   if(values.length!==1)throw new AppError(values.length?'EVIDENCE_CONFLICT':'INSUFFICIENT_EVIDENCE',409,{dimension,productId:o.productId});
   return {productId:o.productId,version:o.version,value:values[0],sources:sources.map(s=>({doc_id:s.doc_id,source_uri:s.source_uri,clause_no:s.clause_no,page:s.page,synthetic:s.synthetic}))};
 })}));
 return {rows,evidence,warning:'仅比较指定审核版本的资料事实；不作产品推荐、费率或承保理赔承诺。'};
}
module.exports={compareOptions};

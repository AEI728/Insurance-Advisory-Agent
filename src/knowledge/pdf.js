const {AppError}=require('../api/errors');
const {redact}=require('../api/middleware/privacy');
async function parsePdf(buffer,signal) {
  if(buffer.subarray(0,5).toString()!=='%PDF-') throw new AppError('VALIDATION_ERROR',422);
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'); let pdf,task;
  try {
    if(signal?.aborted)throw new AppError('TOOL_TIMEOUT',503);
    task=pdfjs.getDocument({data:new Uint8Array(buffer),isEvalSupported:false,useSystemFonts:true});
    signal?.addEventListener('abort',()=>{task.destroy().catch(()=>{});},{once:true});
    pdf=await task.promise;
    if(pdf.numPages>80)throw new AppError('PDF_STRUCTURE_UNRELIABLE',422);
    const pages=[];
    for(let page=1;page<=pdf.numPages;page++) { const p=await pdf.getPage(page),t=await p.getTextContent(); const text=redact(t.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join(''));
      if(/病历|出院记录|住院号/.test(text))throw new AppError('SENSITIVE_INPUT_REJECTED',422);
      if(text.trim().length<20)throw new AppError('PDF_TEXT_NOT_FOUND',422);
      if(/表格|如下表/.test(text))throw new AppError('PDF_STRUCTURE_UNRELIABLE',422);
      pages.push({page,text,clauses:[...text.matchAll(/第[^条\n]{1,12}条|Clause\s+\d+/gi)].map(m=>m[0])}); }
    const full=pages.map(p=>p.text).join('\n');
    return {pages,clauseVersion:full.match(/(?:版本|version)\s*[:：]?\s*([A-Za-z0-9.-]+)/i)?.[1]||'unknown',review_status:'pending',warning:'仅文本提取，须用户确认被保险人和有效性，不构成已核验合同。'};
  } catch(e) { if(e instanceof AppError)throw e; throw new AppError('PDF_TEXT_NOT_FOUND',422); }
  finally { if(task)await task.destroy(); }
}
module.exports={parsePdf};

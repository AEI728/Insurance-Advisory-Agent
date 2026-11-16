const {AppError}=require('../api/errors');
const {actionSchema}=require('./planner');
const {setTimeout:delay}=require('node:timers/promises');
class Executor {
  constructor(config,tools) { this.config=config;this.tools=tools;this.started=Date.now();this.steps=0;this.trace=[]; }
  async run(action,{readOnly=true}={}) {
    action=actionSchema.parse(action);
    if(++this.steps>this.config.maxSteps)throw new AppError('MAX_STEPS_EXCEEDED',409);
    const tool=this.tools[action.action]; if(!tool)throw new AppError('FORBIDDEN',403);
    for(let attempt=0;;attempt++) {
      const remaining=this.config.deadlineMs-(Date.now()-this.started); if(remaining<=0)throw new AppError('TOOL_TIMEOUT',503);
      const controller=new AbortController(),start=Date.now(); let timer;
      try { const result=await Promise.race([Promise.resolve().then(()=>tool(action.input,controller.signal)),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new AppError('TOOL_TIMEOUT',503));},Math.min(this.config.timeoutMs,remaining));})]);
        this.trace.push({tool:action.action,attempt,durationMs:Date.now()-start,status:'ok'}); return result;
      } catch(e) {
        this.trace.push({tool:action.action,attempt,durationMs:Date.now()-start,status:'failed',errorCode:e.code||'DEPENDENCY_ERROR'});
        const retry=readOnly&&[429,502,503,504].includes(e.status)&&attempt<this.config.retries;
        if(!retry)throw e;
        const wait=e.retryAfterMs??(50*2**attempt+Math.floor(Math.random()*20));
        if(wait>=this.config.deadlineMs-(Date.now()-this.started))throw new AppError('TOOL_TIMEOUT',503);
        await delay(wait);
      } finally {clearTimeout(timer);}
    }
  }
}
module.exports={Executor};

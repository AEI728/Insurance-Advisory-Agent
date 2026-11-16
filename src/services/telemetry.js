const pino=require('pino');
function telemetry(config){const logger=pino({base:null,level:process.env.NODE_ENV==='test'?'silent':process.env.LOG_LEVEL||'info'}),samples=[];return {
 middleware(req,res,next){const start=Date.now();res.on('finish',()=>{const event={timestamp:new Date().toISOString(),requestId:req.requestId,route:req.route?.path||'unmatched',durationMs:Date.now()-start,status:res.statusCode,modelMode:res.locals.modelMode||'mock'};samples.push(event);if(samples.length>1000)samples.shift();logger.info(event);});next();},
 summary(){const sorted=samples.map(s=>s.durationMs).sort((a,b)=>a-b);return {requests:samples.length,success:samples.filter(s=>s.status<400).length,clientErrors:samples.filter(s=>s.status>=400&&s.status<500).length,serverErrors:samples.filter(s=>s.status>=500).length,p50Ms:sorted[Math.floor(sorted.length*.5)]||0,p95Ms:sorted[Math.floor(sorted.length*.95)]||0};}
};}
module.exports={telemetry};

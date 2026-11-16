function tokenize(text) { const t=String(text).toLowerCase(), tokens=t.match(/[a-z0-9_-]+/g)||[]; for(const run of t.match(/[\u4e00-\u9fff]+/g)||[]) { if(run.length===1) tokens.push(run); for(let i=0;i<run.length-1;i++)tokens.push(run.slice(i,i+2)); } return [...new Set(tokens)]; }
module.exports={tokenize};

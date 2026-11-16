const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function check(file){new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});}
function scan(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())scan(p);else if(p.endsWith('.js'))check(p);}}
for(const d of ['src','config','scripts','tests'])scan(d);for(const f of ['server.js','workflow.js','playwright.config.js'])check(f);require('./validate-knowledge');

const fs=require('node:fs'),path=require('node:path');
const {ingest}=require('../src/knowledge/ingest');
function seed(db,root){let count=0;for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.json'))){const p=JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));for(const raw of (Array.isArray(p)?p:p.documents||[])){
 const content=[raw.definition,raw.explanation,raw.question,raw.answer,raw.content].filter(Boolean).join('\n');
 if(db.prepare('SELECT id FROM knowledge_documents WHERE id=?').get(raw.id))continue;
 ingest(db,{id:raw.id,title:raw.title||raw.term||raw.question,content,layer:/04-|06-/.test(f)?'rules':'concepts',source_uri:raw.source||f,source_type:'legacy_unreviewed'});count++;}}return count;}
function demo(db){for(const d of require('../tests/fixtures/knowledge.json'))ingest(db,d,{syntheticApproval:true});}
if(require.main===module){const {db,config}=require('./context').context();try{if(process.argv.includes('--demo-fixtures')){if(process.env.NODE_ENV!=='development'||process.env.ENABLE_DEMO_KNOWLEDGE!=='true')throw Error('Demo requires NODE_ENV=development ENABLE_DEMO_KNOWLEDGE=true');demo(db);console.log('Synthetic demo knowledge imported');}else console.log(JSON.stringify({imported:seed(db,config.knowledgePath),review_status:'pending'}));}finally{db.close();}}
module.exports={seed,demo};

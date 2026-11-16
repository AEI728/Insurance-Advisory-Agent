const {review}=require('../src/knowledge/ingest');
const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
for(const k of ['--doc-id','--decision','--reviewer','--evidence-url'])if(!args.includes(k)||!get(k))throw Error('Required '+k);
if(!['approved','rejected'].includes(get('--decision')))throw Error('Invalid decision');
const {db}=require('./context').context();try{const result=review(db,get('--doc-id'),{decision:get('--decision'),reviewer:get('--reviewer'),evidence:get('--evidence-url')});if(!result)throw Error('Unknown document');console.log(JSON.stringify({id:result.id,status:result.review_status}));}finally{db.close();}

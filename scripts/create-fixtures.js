// Run deliberately when changing the synthetic dataset; evaluation never regenerates Gold.
const fs=require('node:fs');
const topics=['保证续保','等待期','责任免除','住院津贴','门诊手术','指定医院','外购药品','免赔额度','赔付比例','职业限制','健康告知','现金价值','保险期间','缴费期间','受益人','犹豫期','宽限期','合同解除','意外定义','伤残等级'];
const knowledge=[{id:'SYN-RULE-BUDGET',title:'合成演示：保障预算规则',content:'合成演示资料：保障规划先核验医疗、意外、重疾、寿险的经济责任。预算信封只是年度保费支出上限，不是产品报价。',layer:'rules',source_uri:'synthetic://budget-v1',source_type:'synthetic_fixture',synthetic:true,fact_ids:['budget_envelope']}];
topics.forEach((term,i)=>knowledge.push({id:'SYN-CLAUSE-'+i,title:'合成T'+i+' '+term,content:`第一条 合成T${i} ${term}：仅用作技术测试，不是真实可投保险产品。${term}测试值为${i+1}年，适用合成条款2026-test。`,layer:'clauses',source_uri:'synthetic://T'+i,source_type:'synthetic_fixture',jurisdiction:'CN',product_id:'SYN-T'+i,clause_version:'2026-test',valid_from:'2026-01-01',fact_ids:[i===0?'renewal_period':'fact_'+i],fact_values:{[i===0?'renewal_period':'fact_'+i]:`${i+1}年`},synthetic:true}));
fs.writeFileSync('tests/fixtures/knowledge.json',JSON.stringify(knowledge,null,2));
const sessions=[];
for(let i=0;i<60;i++){
 const family=i%3===0, age=5+i%10, budget=2000+i*100,mode=family?'family':'individual',group=i%6;
 const item={case_id:'CONSULT-'+String(i+1).padStart(3,'0'),split:i<36?'development':'frozen_regression',mode,intent:'plan',turns:[],expected:{readiness:'INSUFFICIENT',must_not_generate_detailed:true}};
 if(group===0){item.turns=[{text:`全家预算${budget}元/年`}];item.expected.budget_annual_fen=budget*100;}
 if(group===1){item.turns=[{text:`给${age}岁的孩子规划，预算${budget}元/年`}];Object.assign(item.expected,{insured_relation:'child',age,budget_annual_fen:budget*100});}
 if(group===2){item.turns=[{text:`月收入${1+i%5}万`}];item.expected.income_annual_fen=(1+i%5)*10000*12*100;}
 if(group===3){item.turns=[{answer:{field:'household_income_annual_fen',value:30000000}},{answer:{field:'household_income_annual_fen',value:40000000}}];item.expected.conflict_field='household_income_annual_fen';}
 if(group===4){item.turns=[{text:i%2?'复杂病史能否承保':'拒赔争议如何处理'}];item.expected.state='HUMAN_REVIEW_REQUIRED';}
 if(group===5){item.turns=[{answer:{field:'annual_premium_budget_fen',value:null,status:'unknown'}}];item.expected.unknown_budget=true;}
 sessions.push(item);
}
fs.writeFileSync('tests/fixtures/sessions.jsonl',sessions.map(x=>JSON.stringify(x)).join('\n')+'\n');
const queries=topics.map((term,i)=>({case_id:'RAG-'+i,query:`合成T${i}的${term}`,jurisdiction:'CN',product_id:'SYN-T'+i,clause_version:'2026-test',gold_doc_ids:['SYN-CLAUSE-'+i],must_contain_fact_ids:[i===0?'renewal_period':'fact_'+i],expected_status:'sufficient'}));
queries.push({case_id:'RAG-EMPTY',query:'不存在产品免责',product_id:'UNKNOWN',gold_doc_ids:[],must_contain_fact_ids:['exclusions'],expected_status:'insufficient'});
queries.push({case_id:'RAG-WRONG-VERSION',query:'保证续保',product_id:'SYN-T0',clause_version:'1900',gold_doc_ids:[],must_contain_fact_ids:['renewal_period'],expected_status:'insufficient'});
fs.writeFileSync('tests/fixtures/retrieval.jsonl',queries.map(x=>JSON.stringify(x)).join('\n')+'\n');

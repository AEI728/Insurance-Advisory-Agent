function risk(text) { return /拒赔|能否承保|一定赔|保证赔|癌症|复杂病史|健康告知.*(隐瞒|不告知)/.test(text) ? 'HIGH' : /版本不清|离职|冲突/.test(text) ? 'MEDIUM' : 'LOW'; }
function validateReport(r) { return !/保证承保|保证赔付|一定买得到/.test(JSON.stringify(r)) && r.scenarios.every(x=>x.total_fen<=r.budget_fen && x.allocations.every(a=>Number.isSafeInteger(a.allocatedPremiumFen)&&a.allocatedPremiumFen>=0)); }
module.exports={risk,validateReport};

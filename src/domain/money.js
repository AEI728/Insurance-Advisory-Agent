const { AppError }=require('../api/errors');
function parseMoney(text) {
  const m=String(text).match(/^\s*(\d+(?:\.\d+)?)\s*(万|千|百|元)?\s*(?:元)?\s*(?:\/|每)?(月|年)?\s*$/);
  if (!m) throw new AppError('VALIDATION_ERROR',422,{},'金额单位有歧义，请使用例如 2万/月。');
  const amount_fen=Math.round(Number(m[1])*({万:10000,千:1000,百:100}[m[2]]||1)*100), period=m[3]==='月'?'month':'year';
  const annual_fen=amount_fen*(period==='month'?12:1);
  if (!Number.isSafeInteger(annual_fen)) throw new AppError('VALIDATION_ERROR');
  return {amount_fen,period,annual_fen};
}
module.exports={parseMoney};

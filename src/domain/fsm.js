const { AppError } = require('../api/errors');
const { evaluate } = require('./field-policy');
function transition(s, target) {
  if (s.state==='USER_ENDED') throw new AppError('SESSION_ENDED',409);
  if (target==='READY_DETAILED' && evaluate(s).readiness!=='DETAILED') throw new AppError('PROFILE_NOT_READY',409);
  if (target==='REPORT_READY' && s.state!=='VERIFYING') throw new AppError('INVALID_TRANSITION',409);
  if (target==='COMPLETED' && s.state!=='REPORT_READY') throw new AppError('PROFILE_NOT_READY',409);
  const terminal=['PAUSED','USER_ENDED','HUMAN_REVIEW_REQUIRED','BLOCKED'];
  const edges={READY_DETAILED:['ANALYZING'],READY_PRELIMINARY:['ANALYZING'],ANALYZING:['VERIFYING'],VERIFYING:['REPORT_READY'],REPORT_READY:['COMPLETED']};
  if (!terminal.includes(target) && target!=='COLLECTING' && target!=='READY_DETAILED' && target!=='READY_PRELIMINARY' && !edges[s.state]?.includes(target)) throw new AppError('INVALID_TRANSITION',409);
  s.state=target; return s;
}
module.exports={transition};

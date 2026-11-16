const { AppError } = require('../errors');
function redact(text) { return String(text).replace(/\b\d{17}[\dXx]\b/g, '[证件已遮蔽]').replace(/\b1[3-9]\d{9}\b/g, '[电话已遮蔽]').replace(/\b\d{16,19}\b/g, '[账户已遮蔽]'); }
function privacy(value) {
  const raw = JSON.stringify(value);
  if (/(病历|出院记录|检验报告|住院号|身份证|银行卡)/.test(raw) && raw.length > 250) throw new AppError('SENSITIVE_INPUT_REJECTED', 422, {}, '请勿提交完整病历或证件，仅提供必要的粗粒度信息。');
  if (redact(raw) !== raw) throw new AppError('SENSITIVE_INPUT_REJECTED', 422, {}, '检测到证件、账户或手机号，请删除后重试。');
  return value;
}
module.exports = { privacy, redact };

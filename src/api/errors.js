class AppError extends Error {
  constructor(code, status = 422, details = {}, message = code) { super(message); Object.assign(this, { code, status, details }); }
}
module.exports = { AppError };

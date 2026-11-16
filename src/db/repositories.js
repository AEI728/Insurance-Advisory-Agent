const { randomUUID, randomBytes } = require('node:crypto');
const { hash } = require('./connection');
const { AppError } = require('../api/errors');
class Repository {
  constructor(connection, config) { Object.assign(this, connection); this.config = config; }
  create(input) {
    const token = randomBytes(32).toString('base64url'), id = randomUUID();
    const session = { id, mode: input.mode, intent: input.intent, jurisdiction: 'CN', revision: 0, state: 'COLLECTING',
      profile: { members: [], fields: {}, policies: [] }, conflicts: [], candidates: [], consents: {}, turns: 0, createdAt: new Date().toISOString() };
    this.db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?)').run(id, hash(token), 0, this.seal(session), new Date(Date.now() + this.config.ttlHours * 3600000).toISOString());
    return { session, token };
  }
  get(id, token) {
    const row = this.db.prepare('SELECT * FROM sessions WHERE id=?').get(id);
    if (!row || !token || hash(token) !== row.token_hash || row.expires_at < new Date().toISOString()) throw new AppError('UNAUTHORIZED', 401);
    return this.open(row.payload);
  }
  save(s, expected) {
    return this.db.transaction(() => {
      s.revision = expected + 1;
      const r = this.db.prepare('UPDATE sessions SET revision=?, payload=? WHERE id=? AND revision=?').run(s.revision, this.seal(s), s.id, expected);
      if (!r.changes) throw new AppError('REVISION_CONFLICT', 409);
      this.db.prepare("UPDATE reports SET status='superseded' WHERE session_id=? AND revision<>?").run(s.id, s.revision);
      return s;
    })();
  }
  audit(id, type) { this.db.prepare('INSERT INTO audit_events VALUES (?,?,?,?)').run(randomUUID(), hash(id), type, new Date().toISOString()); }
  delete(s) { this.db.transaction(() => { this.db.prepare('DELETE FROM sessions WHERE id=?').run(s.id); this.audit(s.id, 'session_deleted'); })(); }
  putReport(s, report) { this.db.prepare('INSERT INTO reports VALUES (?,?,?,?,?)').run(report.reportId, s.id, s.revision, 'current', this.seal(report)); }
  report(id, token) { const r = this.db.prepare('SELECT * FROM reports WHERE id=?').get(id); if (!r) throw new AppError('NOT_FOUND', 404); this.get(r.session_id, token); return { ...this.open(r.payload), status: r.status }; }
  ticket(s, reason, key) {
    const existing = this.db.prepare('SELECT payload FROM handoff_tickets WHERE session_id=? AND idempotency_key=?').get(s.id, key);
    if (existing) return this.open(existing.payload);
    const ticket = { ticketId: randomUUID(), sessionId: s.id, status: 'PENDING_UNASSIGNED', reasonCode: reason, assignedTo: null, createdAt: new Date().toISOString(), message: '需要专业核验，暂无在线人员接管；请联系保险公司正式核保、理赔或专业法律渠道。' };
    this.db.prepare('INSERT INTO handoff_tickets VALUES (?,?,?,?)').run(ticket.ticketId, s.id, key, this.seal(ticket)); return ticket;
  }
}
module.exports = { Repository };

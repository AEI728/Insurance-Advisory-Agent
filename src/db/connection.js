const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function connect(config) {
  if (config.database !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(config.database)), { recursive: true });
  const db = new Database(config.database);
  db.pragma('foreign_keys=ON'); db.pragma('journal_mode=WAL'); db.pragma('secure_delete=ON');
  db.exec(fs.readFileSync(path.join(__dirname, 'migrations/001_init.sql'), 'utf8'));
  const seal = value => {
    const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', config.key, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
  };
  const open = value => { const b = Buffer.from(value, 'base64'), c = crypto.createDecipheriv('aes-256-gcm', config.key, b.subarray(0, 12)); c.setAuthTag(b.subarray(12, 28)); return JSON.parse(Buffer.concat([c.update(b.subarray(28)), c.final()]).toString()); };
  return { db, seal, open };
}
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
module.exports = { connect, hash };

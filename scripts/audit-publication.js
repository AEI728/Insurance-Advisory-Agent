// Scans only the staged public tree. Never prints secret values or matching lines.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const localSecrets = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8').split(/\r?\n/).flatMap(line => {
  const match = line.match(/^\s*([A-Z_]*(?:KEY|TOKEN|PASSWORD|SECRET)[A-Z_]*)\s*=\s*(.*?)\s*$/);
  if (!match) return [];
  const value = match[2].replace(/^['"]|['"]$/g, '');
  return value.length >= 8 ? [value] : [];
}) : [];
const findings = [];
const staged = execFileSync('git', ['cat-file', '--batch'], {
  input: files.map(file => ':' + file).join('\n') + '\n', maxBuffer: 20 * 1024 * 1024
});
const contents = new Map();
let cursor = 0;
for (const file of files) {
  const end = staged.indexOf(10, cursor);
  const header = staged.subarray(cursor, end).toString('utf8').split(' ');
  const size = Number(header[2]);
  if (end < 0 || !Number.isSafeInteger(size)) throw new Error('Cannot inspect staged tree');
  cursor = end + 1;
  contents.set(file, staged.subarray(cursor, cursor + size).toString('utf8'));
  cursor += size + 1;
}
for (const file of files) {
  if (/(^|\/)(?:\.env(?:\.(?!example$).+)?|node_modules|data|uploads|reports|artifacts|test-results|playwright-report)(\/|$)|\.(?:sqlite(?:-wal|-shm)?|db|pem|p12|pfx|key)$/i.test(file)) {
    findings.push({ file, type: 'private-file' }); continue;
  }
  const text = contents.get(file);
  const rules = {
    'credential': /(?:sk-(?:proj-)?[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/,
    'credential-url': /https?:\/\/[^\s/@]+:[^\s/@]+@/,
    'email': /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    'machine-path': /\b[A-Z]:[\\/](?:Users|研究生|Codex|Git|NodeJS)[\\/]/i
  };
  for (const [type, pattern] of Object.entries(rules)) if (pattern.test(text)) findings.push({ file, type });
  if (localSecrets.some(value => text.includes(value))) findings.push({ file, type: 'local-secret-value' });
}
console.log(JSON.stringify({ files: files.length, findings }, null, 2));
if (findings.length) process.exitCode = 1;

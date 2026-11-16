const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('dotenv').config();
const {loadConfig}=require('../src/config');
const config=loadConfig();
if(config.ephemeralKey)throw Error('Restore requires stable DATA_ENCRYPTION_KEY');
const [input,target]=process.argv.slice(2);if(!input||!target)throw Error('Usage: node scripts/restore.js backup.enc NEW_DATABASE_PATH');
const out=path.resolve(target);if(fs.existsSync(out))throw Error('Refusing to overwrite existing database');
const b=fs.readFileSync(input),decipher=crypto.createDecipheriv('aes-256-gcm',config.key,b.subarray(0,12));decipher.setAuthTag(b.subarray(12,28));const plain=Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]);if(plain.subarray(0,15).toString()!=='SQLite format 3')throw Error('Invalid SQLite backup');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,plain,{flag:'wx',mode:0o600});plain.fill(0);console.log('Restored to a new database path; configure DATABASE_PATH and verify before switching.');

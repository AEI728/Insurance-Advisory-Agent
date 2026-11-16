require('dotenv').config();
const {loadConfig}=require('./src/config');
const {createApp}=require('./src/api/app');
const config=loadConfig();
if(config.ephemeralKey)console.warn('Development ephemeral key: memory DB only. Set DATA_ENCRYPTION_KEY for persistence.');
if(config.ephemeralKey&&config.database!==':memory:')throw new Error('Persistent DB requires DATA_ENCRYPTION_KEY');
const app=createApp({config});
function purgeExpired(){app.locals.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());}
purgeExpired();
const cleanup=setInterval(purgeExpired,3600000);cleanup.unref();
const server=app.listen(config.port,config.host,()=>console.log(`Insurance Agent: http://${config.host}:${config.port} (local controlled demo)`));
function close(){server.close(()=>{app.locals.db.close();process.exit(0);});}
process.on('SIGTERM',close);process.on('SIGINT',close);

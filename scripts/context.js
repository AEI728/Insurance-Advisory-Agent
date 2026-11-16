require('dotenv').config();
const {loadConfig}=require('../src/config');
const {connect}=require('../src/db/connection');
function context(){const config=loadConfig();if(config.ephemeralKey)throw Error('Set DATA_ENCRYPTION_KEY and DATABASE_PATH for persistent management commands');if(config.database===':memory:')throw Error('Set persistent DATABASE_PATH');return {config,...connect(config)};}
module.exports={context};

const {defineConfig}=require('@playwright/test');
const fs=require('node:fs');
const channel=process.env.PLAYWRIGHT_CHANNEL || (process.platform==='win32' && fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'msedge' : 'chromium');
module.exports=defineConfig({
  testDir:'tests/e2e',workers:1,timeout:120000,
  use:{baseURL:'http://127.0.0.1:4399',browserName:'chromium',channel,launchOptions:{timeout:120000,args:['--disable-gpu']}},
  webServer:{command:'node server.js',url:'http://127.0.0.1:4399/api/health',timeout:120000,reuseExistingServer:false,
    env:{PORT:'4399',HOST:'127.0.0.1',NODE_ENV:'test',USE_MOCK_LLM:'true',DATABASE_PATH:':memory:',DATA_ENCRYPTION_KEY:'',ADMIN_API_TOKEN:'e2e-local-admin'}},
  reporter:'list'
});

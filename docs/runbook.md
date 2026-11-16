# 本地操作与维护

仅绑定127.0.0.1。本项目未放行公网商用。推荐 Node22（.nvmrc），本机实测为Node24.20.0。

1. `npm ci`，`npx playwright install chromium`。
2. 复制 .env.example 到自己管理的配置，**不要覆盖已有 .env**。本地纯离线可直接设置 USE_MOCK_LLM=true 后 `npm start`；未配密钥时是内存库，重启丢失。
3. 如需持久化，先执行 `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`，把结果安全写入 DATA_ENCRYPTION_KEY，并设置 DATABASE_PATH=./data/insurance-agent.sqlite。密钥不能入库或分享。
4. 配置完成后依次 `npm run db:migrate`、`npm run kb:seed`、`npm run kb:check`、`npm start`。访问本机终端打印地址，默认4311；保留用户现有PORT配置。
5. 原始150条知识全部pending，详细分析会安全返回证据不足。若要演示完整报告，在同一数据库配置上设置 NODE_ENV=development 和 ENABLE_DEMO_KNOWLEDGE=true，运行 `npm run kb:demo`，重启服务。页面及报告标明 SYN 合成内容，不能当真实条款。

PowerShell 进程配置示例：`$env:USE_MOCK_LLM='true'; $env:PORT='4311'; npm start`。若配置持久库，必须设置稳定 DATA_ENCRYPTION_KEY；不要把临时随机密钥用于已有数据。

验收：`npm run ci:verify`，`npm run smoke`。POSIX另可 `bash scripts/smoke.sh`；脚本启动独立临时本机服务，不依赖已有后台进程。

管理员审核按文档逐条执行 `node scripts/review-knowledge.js --doc-id ID --decision approved --reviewer REVIEWER --evidence-url RECORD`。必须有真实审核记录，不能自动批准真实知识；专业资格在系统外确认。API管理员令牌必须使用高强度随机值。

备份：`npm run backup -- data/snapshot.enc` 调用SQLite online backup，再用同一密钥AES-GCM加密外层备份。文件头12字节nonce+16字节tag，其余密文。恢复须在服务关闭时，用正确密钥解密到新数据库路径，再配置 DATABASE_PATH 指向恢复文件并执行健康/报告一致性检查；保留原文件以便回滚。绝不在WAL活动时只复制主库。密钥丢失无法恢复。

故障：端口占用时更换PORT，不杀未知进程；数据库无法解密时检查原密钥；PDF扫描件/密码保护/表格不可靠时人工核验；429等待窗口后再试；401核对会话令牌和过期时间；409按missingFields或conflicts处理；工具超时后状态可恢复，不假装成功。

真实模型：支持OpenAI Responses或用户已有DeepSeek兼容配置。仅在明确会话 external_llm 同意后解释审核证据；模型提供方数据处理和法务审查未完成前只能使用授权合成资料。本次交付不调用真实模型，不验证账户可用型号、费率或专业准确率。

生产：NODE_ENV=production 直接拒绝启动，直到真实身份体系及法务/专业审核另行实现。不要设置虚假的审批环境变量绕过限制。到期会话定期清理及离线备份保留策略由运维制定。

Windows浏览器验收：检测到系统Edge时默认使用msedge，避免本机下载版Chromium初始化超时；Linux CI使用chromium。可设置PLAYWRIGHT_CHANNEL显式选择通道。项目.npmrc禁用第三方安装脚本，SQLite13使用随包的各平台预编译模块，真实加载/FTS/事务由测试验证。

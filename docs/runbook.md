# 本地运行与维护

## 配置

推荐使用 Node.js 22.16 或更高版本。执行 `npm ci` 后，复制 `.env.example` 为 `.env`，保留 `USE_MOCK_LLM=true` 即可离线运行。服务仅监听 `127.0.0.1`，配置模板端口为 `4312`；运行 `npm start` 后以终端输出地址为准。

未配置 `DATA_ENCRYPTION_KEY` 时使用进程内数据库，重启会丢失数据。持久化需要稳定的32字节 Base64 密钥及 `DATABASE_PATH`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

把生成的值写入 `.env` 的 `DATA_ENCRYPTION_KEY`，设置 `DATABASE_PATH=./data/insurance-agent.sqlite`，依次执行：

```bash
npm run db:migrate
npm run kb:seed
npm run kb:check
```

密钥不应提交或共享。已有数据库必须沿用原密钥；不要每次启动时重新生成。

## 知识维护

原始资料通过 `kb:seed` 导入后保持 `pending`，尚不能作为正式回答依据。开发演示可在 `.env` 中设置 `NODE_ENV=development` 和 `ENABLE_DEMO_KNOWLEDGE=true`，执行 `npm run kb:demo` 导入合成资料。合成资料仅用于测试和演示。

正式资料需要逐条审核，不能自动批量批准：

```bash
node scripts/review-knowledge.js --doc-id DOCUMENT_ID --decision approved --reviewer REVIEWER --evidence-url REVIEW_RECORD
```

填写实际文档ID、审核人和审核记录。审核人员资格应由资料维护方核实。管理 API 仅允许本机回环地址，并需要配置 `ADMIN_API_TOKEN`。

## 备份与恢复

停止修改配置，确认 `DATABASE_PATH` 与原始加密密钥正确后，执行：

```bash
npm run backup -- data/backup.enc
```

备份工具使用 SQLite online backup 获取一致性快照，再以 AES-256-GCM 加密；不能在 WAL 活动时只复制主数据库文件。

恢复前停止服务，用原密钥解密到一个不存在的新路径：

```bash
node scripts/restore.js data/backup.enc data/restored.sqlite
```

工具拒绝覆盖现有文件。将 `DATABASE_PATH` 改为恢复后的路径，启动服务并核对会话、报告与健康检查；确认正常后再决定旧备份的保留期限。

## 检查与测试

```bash
npm run check
npm run smoke
npx playwright install chromium
npm run ci:verify
```

浏览器测试会自动启动和关闭独立 Mock 服务，不依赖手工运行的实例。Windows 默认优先使用已安装的 Edge，其他环境使用 Chromium，可设置 `PLAYWRIGHT_CHANNEL` 覆盖。`.npmrc` 禁用依赖安装脚本，SQLite 使用包内预编译模块；引入需要构建的新依赖时应先评估兼容性。

## 故障排查

| 情况 | 处理 |
| --- | --- |
| 端口被占用 | 更换 `.env` 中的 `PORT` 后重启 |
| 数据库无法解密 | 检查是否使用创建该数据库时的密钥 |
| 没有适用证据 | 检查知识审核状态、地区、产品与版本；不要绕过审核 |
| 画像未就绪或存在冲突 | 按页面提示补充、确认信息，或先生成初步建议 |
| PDF 无文本或结构不可靠 | 提供可复制文本的合同，或通过正式渠道核验 |
| 401 / 会话无法访问 | 检查令牌、会话有效期；服务使用内存库时重启会清空会话 |
| 429 / 工具超时 | 等待后手动重试；不得把失败请求视为已完成核验 |
| 外部模型未调用 | 检查模型配置、审核证据和会话的单独授权 |

会话默认有效期24小时，服务启动时及每小时清理过期会话。历史备份需按实际数据保留策略另行清理。

当前不支持公网生产部署；`NODE_ENV=production` 会拒绝启动。外部模型、实际用户资料和正式合同的处理应先满足相应授权及专业审核要求。

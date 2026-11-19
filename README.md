# 小安 · 保险规划助手

可在本地运行的个人与家庭保险需求梳理工具。通过分步问询整理保障对象、已有保障、经济责任和年度预算，提供保障方向、预算情景和条款核验清单。

适用于保险知识学习和保障规划辅助，不提供具体产品销售、实时报价、正式核保或理赔裁定。

## 功能

- **个人 / 家庭规划**：个人模式规划一名被保险人，也可以为孩子或其他家人规划；家庭模式分别记录多位成员。
- **信息确认与修改**：自由输入先提取候选信息，确认后参与分析；支持未知项、冲突确认、暂停与恢复。
- **保障分析与预算情景**：资料充分后生成两档预算分配；调整预算或画像后可重新计算，旧报告标记失效。
- **知识与条款检索**：使用本地 SQLite FTS5 中文检索，只引用符合审核、地区和版本条件的资料；证据不足时提示补充。
- **合同资料与导出**：提取文字版 PDF 的文本、页码和条款信息，支持报告 TXT / JSON 导出。
- **隐私控制**：会话访问令牌、敏感输入拦截、加密存储及会话删除；外部模型调用需要单独授权。

## 本地运行

### 1. 环境准备

安装 Node.js 22.16 或更高版本，以及 Git。使用 nvm 时可按仓库中的 `.nvmrc` 选择 Node.js 22。

```bash
git clone https://github.com/AEI728/Insurance-Advisory-Agent.git
cd Insurance-Advisory-Agent
npm ci
```

### 2. 创建配置文件

首次运行时复制配置模板；已有 `.env` 时直接编辑，不要覆盖。

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

macOS / Linux：

```bash
cp .env.example .env
```

默认 `USE_MOCK_LLM=true`，无需模型 API Key。配置模板中的服务端口为 `4312`。

### 3. 启动

```bash
npm start
```

浏览器访问 <http://127.0.0.1:4312>。如果修改了 `PORT`，以终端输出的地址为准。按 `Ctrl+C` 停止服务。

默认未配置加密密钥时使用内存数据库，服务重启后会话会丢失。需要保存会话或体验完整详细报告时，按下一节配置持久化。

## 保存数据与体验完整报告

先停止服务。执行以下命令生成加密密钥，将输出的整行保存到 `.env` 的 `DATA_ENCRYPTION_KEY`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

在 `.env` 中设置：

```dotenv
NODE_ENV=development
USE_MOCK_LLM=true
DATABASE_PATH=./data/insurance-agent.sqlite
DATA_ENCRYPTION_KEY=替换为刚生成的密钥
ENABLE_DEMO_KNOWLEDGE=true
```

然后初始化数据库和演示资料：

```bash
npm run db:migrate
npm run kb:seed
npm run kb:demo
npm start
```

`kb:seed` 导入的原始资料默认待审核，不能直接用于正式结论。`kb:demo` 额外导入带有 `SYN-` 标识的合成资料，供本地体验检索、详细报告和条款对比；这些资料不对应真实可投保产品。

请妥善保留加密密钥。更换或丢失密钥后，已有加密数据将无法读取。`.env`、数据库、上传资料和运行输出不会纳入 Git。

## 使用方法

1. 选择个人或家庭模式，以及保障规划、知识解释或条款比较任务，并阅读隐私说明。
2. 添加被保险人，按提示填写信息；自由输入后先核对候选信息，再点击确认。
3. 资料不全时生成初步建议；详细情景需要满足画像要求并有适用的审核证据。知识解释无需补齐规划画像。
4. 查看保障方向、预算情景和核验清单，按需导出 TXT / JSON。
5. 修改信息后重新分析；结束时可暂停、保留或删除会话。

文字版 PDF 不超过 5 MiB；扫描件、密码保护或结构无法可靠解析的文件需要另行核验。不要输入姓名、身份证号、手机号、银行卡号或完整病历。

“人工核验”会创建待处理工单，目前没有在线顾问接管服务。

## 可选：接入模型服务

本地规则、画像校验、预算计算和检索不依赖外部模型。需要模型辅助解释时，将 `USE_MOCK_LLM` 设为 `false`，在 `.env` 中填写所选服务的配置：

| 服务 | 配置项 |
| --- | --- |
| OpenAI | `OPENAI_API_KEY`、`OPENAI_MODEL`；自定义接口地址可设置 `OPENAI_BASE_URL` |
| DeepSeek | `DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL` |

填写服务商实际支持的模型名称；选择一个服务即可。密钥仅保存在服务端，修改配置后重启服务。

用户还需在页面单独授权外部模型传输。未授权时保持本地逻辑；未成年人及健康资料不外发。模型补充内容必须能在审核来源中直接定位。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm start` | 启动本地服务 |
| `npm run dev` | 开发模式，代码变化后自动重启 |
| `npm run check` | 检查语法和知识库格式 |
| `npm run smoke` | 运行 HTTP 冒烟检查 |
| `npm run ci:verify` | 运行检查、单元/接口/浏览器测试和离线评测 |
| `npm run backup -- data/backup.enc` | 对配置的持久数据库生成加密在线备份 |

首次运行浏览器测试前执行 `npx playwright install chromium`。Windows 检测到系统 Edge 时默认使用 Edge，其他环境使用 Chromium；可通过 `PLAYWRIGHT_CHANNEL` 指定通道。

更多配置、知识审核、备份恢复和故障处理见[运行手册](docs/runbook.md)。二次开发可参考 [API 文档](docs/api.md)、[数据处理说明](docs/data-governance.md)和[测试与评测说明](docs/evaluation.md)。

## 使用范围

当前服务仅监听本机回环地址，`NODE_ENV=production` 会拒绝启动。项目没有公网账户体系、实际产品费率或正式人工服务，适合本地学习与受控演示。实际投保、核保和理赔应以保险公司的正式条款及结论为准。

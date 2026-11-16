# 实施与验收记录

日期：2026-11-10（Asia/Singapore）。需求来源：小安_保险规划Agent_可执行技术实施规范.md v1.0。

基线提交：`0f2b2a96106217eedb24e8852a303f09cfbe4556`。当前实现为此提交之上的未提交工作区，未创建虚构任务提交SHA，也未自动推送。开始时已有 `.env.example`、`config/agent.config.js`、`src/services/llm.js`、职业发展复盘文档的用户修改；保留其意图，职业发展文档没有编辑。

环境：Windows / PowerShell，Node v24.20.0，npm11.19.0。`.nvmrc`与CI为22；Node22本机未实测。

## 实际交付

| 任务 | 实现及证据 |
|---|---|
| T00 | 目录、依赖、锁文件、git差异与SHA检查；原 npm ci 及 npm run check 退出0（原库6文件150条） |
| T01 | createApp依赖注入、配置校验、统一错误与requestId；仅本机，生产启动阻断 |
| T02 | WAL/外键/幂等迁移，AES-GCM加密会话聚合、报告、工单，token仅hash；真实临时SQLite重启测试 |
| T03 | 同源/Helmet/CSP/限流/静态白名单、输入PII拒收、分目的授权、最小日志、删除级联 |
| T04 | 字段三态、确认来源/时间、冲突候选、Hard Gates、权重及服务端状态机 |
| T05 | 会话/消息/画像/模式修改，revision事务CAS；旧chat/import返回410 |
| T06 | 原150条默认pending；管理员逐文档审核；SYN演示开关；FTS5父子chunk |
| T07 | CJK二元词、地区/审核/日期/产品/版本过滤、事实缺失与冲突阻断；无向量检索 |
| T08 | 动作白名单、Zod协议、受控执行、AbortController、只读重试/429预算/权限不重试；可注入LLM替身 |
| T09 | 成员级同类保单归属、团险unknown不抵扣、预算信封两档及总额约束、缺参数只给定性缺口 |
| T10 | 文字PDF页码、条款号、版本提取与PII遮蔽；扫描/损坏资料拒绝；原件不落盘 |
| T11 | 结构化报告及TXT/JSON导出、修改使旧报告superseded、待人工核验工单幂等 |
| T12 | 新版首页对接服务端；个人可为孩子；家庭对象、确认/冲突/未知、暂停恢复、删除、PDF/授权/工单 |
| T13 | node:test + supertest + Playwright + 离线82例评测；GitHub Actions工作流 |
| T14 | README、API、数据治理、运行备份恢复、ADR、真实验证记录 |

## 已完成的执行

| 命令 | 退出码及结果 |
|---|---|
| 原版 npm ci；npm run check | 0；150条知识结构检查通过 |
| npm install；playwright install chromium | 0；锁文件已维护 |
| node --test tests/unit/*.test.js tests/integration/*.test.js | 0；41/41，含15项隐私相关测试；artifacts/tests.log |
| node scripts/eval.js | 0；82/82（60咨询+22检索）；20个有Gold查询Recall@4=1.0；合成固定集合，不代表专业或泛化准确率 |
| node scripts/smoke.js | 0；真实HTTP鉴权、画像门槛、revision、空证据、工单、删除链路通过 |
| npm run db:migrate；kb:seed；kb:check；kb:demo | 0；迁移1、原库150条pending、显式导入21条SYN演示资料 |
| npm run backup -- data/verification-backup.enc | 0；SQLite online backup后AES-GCM封装 |
| node scripts/restore.js ... data/verification-restored.sqlite | 0；解密到新路径，拒绝覆盖既有数据库 |
| Playwright单项个人完整流程（完整Chromium） | 0；1/1；artifacts/browser-debug.log |

最终干净安装和 `npm run ci:verify` 的结果在本报告末尾补录，不能以上述分项结果替代全量通过。

## 首轮失败与修正

1. 测试fixture尚未生成时提前执行集成测出现MODULE_NOT_FOUND，生成并冻结实际JSON/JSONL后重跑通过。
2. 首轮评测79/82，后三例因共用测试实例触发真实180请求/分钟限流；改为每咨询独立隔离实例，未移除限流、未删失败样本，重跑82/82。
3. PDF新版SDK的document.destroy不可用，改为释放loadingTask，2项PDF回归通过。
4. headless-shell在本机创建page超时（30秒与120秒）；完整Chromium已实测通过个人流程。全量浏览器结果须独立核对。
5. 初次ci:verify停留在逐文件子进程语法检查，人工终止，不能算通过；改为同进程vm.Script语法编译，仍逐文件检查真实源码。
6. 基线安装与首次新依赖安装发生重叠，产生TAR_ENTRY_ERROR警告；最终必须干净npm ci重现成功后才认可安装验收。

## 边界与仍待外部审核

- expert_review_status=not_done。原始知识不得直接充当正式合同结论，没有法务、持证人员审核或真实客服。真实LLM未调用；计费、线上型号、专业建议质量均未验证。
- 当前使用聚合加密JSON，未按规范示例拆分profile_members/profile_fields/consents实体表；见ADR。Node22与GitHub远端CI尚未运行；本机结果只代表Node24。
- 开放文本抽取为有限确定性规则，复杂自然语言回退固定字段确认；不声称通用语义抽取准确率。比较资料不足时输出核验维度；不声称已核验用户完整合同。
- PDF仅提取文字，表格/版式不可靠时拒绝；不具备OCR、正式医疗判断。切分按条款和字符近似，未实现复杂表格重建或跨条款语义推理。
- 预算按角色分配支出上限，缺少费率与明确责任参数时只输出定性缺口，不承诺“预算内必买到”。
- 到期会话每小时清理（及启动清理），历史备份保留须运维批准；数据删除不声称擦除所有离线备份。
- 本地匿名token不是公网身份认证。生产启动被强制阻断；未部署、未推送、未自动外发用户资料或联系第三方。

本实现交付本地可验证流程；复杂合同结构、正式知识审核与生产认证仍不能被描述为全部完成或商用放行。

补充安装与环境记录：最终普通 `npm ci` 在项目 .npmrc 禁用依赖生命周期脚本后退出0，安装141个包；使用包内经过实际加载验证的SQLite预编译模块，未要求用户安装C++工具链。日志：artifacts/install-final.log。此前默认重编译失败是缺少Visual Studio，保留artifacts/install.log作为失败证据。

浏览器补充：完整下载版Chromium在本机页面初始化仍有不稳定超时；本机已安装Edge可稳定进入业务流程，Playwright现在在Windows检测到Edge时默认使用msedge，在Linux或未检测到Edge时使用chromium，可通过PLAYWRIGHT_CHANNEL覆盖。首次Edge全量运行3/4通过，剩余报告测试使用innerText读取折叠JSON区域导致空字符串；改用textContent保留原预算与superseded断言，完整重跑记录见后续终验条目。

指定审核版本的合同事实对比已补充 `/sessions/:id/compare` 与页面入口；对每个维度要求明确事实值和来源，缺失或冲突返回409。月收入确认保留amount_fen/period/annual_fen，服务端校验归一化结果一致性；针对篡改与存储增加回归测试。

## 最终终验（2026-11-10）

- `npm ci`：退出0，普通命令重现安装141包；artifacts/install-final.log。
- `npm run ci:verify`：退出0；artifacts/ci-verify.log。14/14单元测试、29/29接口测试、4/4浏览器测试、82/82离线评测。无跳过或todo测试。
- 浏览器：本机Windows + 系统Edge/Chromium引擎；webServer自动启动并关闭独立Mock服务。覆盖个人给孩子、家庭三成员、画像不足、隐私、暂停/删除、工单无人员、报告预算8000→5000、旧报告superseded。
- 检索：20个非空Gold查询的Recall@4宏平均1.0；另2条为空结果/错误版本拒答。expert_review_status=not_done；这是合成技术回归结果，非专业建议准确率。
- `bash scripts/smoke.sh`（Git Bash）：退出0，真实HTTP冒烟通过。
- 最终模型证据约束修正后单独重跑llm-consent.test.js与check及smoke：结果见artifacts/llm-final-test.log；只允许来源中可直接定位的模型补充文字，其余使用确定性来源回答，避免无依据自由改写。未调用真实付费模型。
- 页面截图已实际生成并检查：artifacts/screenshots/detailed-report.png、family.png、individual.png。截图全部为合成数据；报告默认展示中文摘要，JSON放在折叠详情。
- `git diff --check`：退出0。未自动提交/推送；原用户职业发展文档及DeepSeek配置意图保留。

Node22实际运行、正式合同专业审核、法务审查与公网身份体系仍未完成。本次交付不代表公网商用放行；复杂PDF结构、通用语义抽取等能力边界仍按上文记录。

2026-11-16发布准备：用户明确授权脱敏后写入指定GitHub仓库；已追加publication-audit.md记录公开范围与扫描方式，个人复盘仅本地保留。本报告前述“未提交/推送”描述的是11月10日交付时状态；本次提交以Git提交记录为准。

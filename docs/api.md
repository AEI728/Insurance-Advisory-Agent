# API v1

JSON 请求；创建会话以外，有状态接口使用 Authorization: Bearer TOKEN。所有写入提供 expectedRevision；冲突409。消息/画像只接受明确的 schema 字段，金额 `_fen` 为人民币分整数。响应带 X-Request-Id，错误正文为 `{error:{code,message,details},requestId}`。

| 方法 | 路径 | 请求/说明 |
|---|---|---|
| GET | /api/health；/api/v1/health/ready | 活性、SQLite FTS可用性与模型模式 |
| POST | /api/v1/sessions | mode:individual/family, intent:plan/explain/compare, jurisdiction:CN, privacyNoticeAccepted:true |
| GET | /api/v1/sessions/:id | 状态、revision、profileSummary、missingFields、conflicts、nextQuestion |
| POST | /api/v1/sessions/:id/messages | text 或 answer:{field,value,memberId?,status?}；自由文本产生待确认 candidates |
| PATCH | /api/v1/sessions/:id/profile | updates:[{field,value,memberId?,status?,resolveConflict?}]；members:[{member_id,relation}]；mode?；policies? |
| POST | /api/v1/sessions/:id/consents | purpose:external_llm/sensitive_data/handoff, granted, noticeVersion:v1 |
| POST | /api/v1/sessions/:id/analyze | detail:preliminary/detailed |
| POST | /api/v1/sessions/:id/compare | options:[{productId,version,query?}]（2至4项）,dimensions:[fact_id]；只比较有审核事实值与来源的指定版本，否则409 |
| GET | /api/v1/reports/:id | 带 current/superseded 的结构化报告 |
| GET | /api/v1/reports/:id/export?format=json或txt | 报告下载 |
| POST | /api/v1/sessions/:id/attachments | multipart：file PDF <=5MiB；expectedRevision 字符串 |
| POST | /api/v1/sessions/:id/handoffs | reasonCode:USER_REQUEST/HIGH_RISK/EVIDENCE_CONFLICT, consentToShareSummary:true, idempotencyKey |
| GET | /api/v1/handoffs/:id | 待人工核验工单 |
| POST | /api/v1/sessions/:id/close | reason:complete/user_end/pause/resume；complete 须已有报告 |
| DELETE | /api/v1/sessions/:id | expectedRevision；204 |
| GET | /api/v1/knowledge/search | q, layer?, productId?, version?；仅审核及日期适用证据 |
| POST | /api/v1/admin/knowledge/import | 管理员文档，默认pending |
| POST | /api/v1/admin/knowledge/:id/review | decision:approved/rejected,reviewer,evidence；审核人员及资格须人工核验 |

旧 /api/chat 与 /api/knowledge/import 返回410，禁止绕过。未知接口404。常见错误：401 UNAUTHORIZED、403 FORBIDDEN、422 VALIDATION_ERROR/SENSITIVE_INPUT_REJECTED、409 REVISION_CONFLICT/PROFILE_NOT_READY/INSUFFICIENT_EVIDENCE/EVIDENCE_CONFLICT/MAX_CLARIFICATION_TURNS、503 TOOL_TIMEOUT。

成员字段：age, occupation_risk, dependency_role, income_annual_fen, responsibilities, social_insurance_status, existing_coverage_status。家庭字段：goals,region,annual_premium_budget_fen,essential_expense_annual_fen,liability_balance_fen,household_income_annual_fen。

保单：policy_id,insured_member_id,kind(term_life/medical/critical_illness/accident),sum_insured_fen,source(personal/employer_group),validity(valid/invalid/unknown),evidence_id。只有有效、本人、同类且有evidence_id的保单计入已确认保额；这仍需人工确认原始依据。

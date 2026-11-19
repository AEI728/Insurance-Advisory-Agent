# 保险 Agent MVP 知识库

本目录包含 150 条结构化知识。配置持久化数据库后，执行 `npm run kb:seed` 导入 SQLite，所有条目默认处于待审核状态；仅审核通过且符合地区、日期及版本要求的资料参与正式检索。

| 文件 | 模块 | 条数 |
| --- | --- | ---: |
| `01-concepts.json` | 保险基础概念 | 30 |
| `02-social-insurance.json` | 社保与医保 | 20 |
| `03-insurance-types.json` | 意外、医疗、重疾、寿险 | 40 |
| `04-configuration-rules.json` | 配置方法与人群模板 | 20 |
| `05-faq.json` | 高频问答 | 30 |
| `06-compliance.json` | 免责声明和禁用规则 | 10 |

## 字段约定

- 必填：`id`、`type`、`title`、`source`、`reviewedBy`、`updatedAt`。
- 正文：通用条目用 `content`；概念可用 `definition` + `explanation`；FAQ 用 `question` + `answer`。
- 可选：`category`、`term`、`related`、`severity`。
- 日期统一使用 `YYYY-MM-DD`。
- `reviewedBy` 当前均为待审核状态，正式上线前应由持证顾问、法务或当地政策负责人复核。

## 维护与校验

```bash
npm run check:knowledge
```

政策类条目应记录官方原文链接或文件编号，并在参保地规则变化后更新。产品 MVP 不包含具体产品推荐。

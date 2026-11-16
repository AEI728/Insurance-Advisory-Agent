const path = require("node:path");

// 知识库配置集中在这里，后续增加向量数据库、Embedding 服务或对象存储时只改此处。
const knowledgeBasePath = path.resolve(
  process.env.KNOWLEDGE_BASE_PATH || path.join(process.cwd(), "knowledge-base")
);

module.exports = {
  port: Number(process.env.PORT || 4312),
  llm: {
    // 默认使用模拟模式；DeepSeek 正式部署需设置 USE_MOCK_LLM=false 和 DEEPSEEK_API_KEY。
    useMock: process.env.USE_MOCK_LLM !== "false",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL || "deepseek-flash"
  },
  rag: {
    topK: Number(process.env.RAG_TOP_K || 4),
    // MVP 使用本地结构化 JSON；后续可在 KnowledgeStore 边界替换为向量数据库。
    knowledgeBasePath
  }
};

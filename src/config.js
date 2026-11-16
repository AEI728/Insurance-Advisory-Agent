const { randomBytes } = require('node:crypto');
const path = require('node:path');
const { z } = require('zod');
function loadConfig(env = process.env) {
  const n = (key, fallback, max = 100000000) => z.coerce.number().int().positive().max(max).parse(env[key] || fallback);
  const key = env.DATA_ENCRYPTION_KEY ? Buffer.from(env.DATA_ENCRYPTION_KEY, 'base64') : randomBytes(32);
  if (key.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes base64');
  // P1 has no production identity adapter. Never accept approval booleans as authentication.
  if (env.NODE_ENV === 'production') throw new Error('Production blocked: formal identity adapter and legal/professional review are not implemented');
  if (env.HOST && env.HOST !== '127.0.0.1' && env.HOST !== 'localhost') throw new Error('P1 requires loopback HOST');
  return { host: env.HOST || '127.0.0.1', port: n('PORT', 4311, 65535), key,
    ephemeralKey: !env.DATA_ENCRYPTION_KEY, database: env.DATABASE_PATH || (env.DATA_ENCRYPTION_KEY ? './data/insurance-agent.sqlite' : ':memory:'),
    adminToken: env.ADMIN_API_TOKEN || '', ttlHours: n('SESSION_TTL_HOURS', 24),
    maxTurns: n('MAX_CLARIFICATION_TURNS', 12), timeoutMs: n('TOOL_TIMEOUT_MS', 5000),
    deadlineMs: n('TASK_DEADLINE_MS', 30000), retries: z.coerce.number().int().min(0).max(2).parse(env.MAX_TOOL_RETRIES ?? 2), maxSteps: n('MAX_AGENT_STEPS', 6, 6),
    uploadMax: n('UPLOAD_MAX_BYTES', 5242880, 5242880), topK: n('RAG_TOP_K', 4, 20),
    knowledgePath: path.resolve(env.KNOWLEDGE_BASE_PATH || 'knowledge-base'),
    llm: { useMock: env.USE_MOCK_LLM !== 'false', apiKey: env.OPENAI_API_KEY || env.DEEPSEEK_API_KEY || '',
      baseURL: env.OPENAI_BASE_URL || env.DEEPSEEK_BASE_URL, model: env.OPENAI_MODEL || env.DEEPSEEK_MODEL || 'gpt-4.1-mini',
      timeout: n('LLM_TIMEOUT_MS', 15000), provider: env.OPENAI_API_KEY ? 'openai' : 'deepseek' }
  };
}
module.exports = { loadConfig };

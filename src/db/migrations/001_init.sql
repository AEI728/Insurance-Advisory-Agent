CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, revision INTEGER NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS handoff_tickets (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, idempotency_key TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(session_id,idempotency_key));
CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, session_hash TEXT, type TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS knowledge_documents (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS knowledge_chunks (id TEXT PRIMARY KEY, doc_id TEXT NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE, payload TEXT NOT NULL);
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(chunk_id UNINDEXED, tokens);
PRAGMA user_version=1;

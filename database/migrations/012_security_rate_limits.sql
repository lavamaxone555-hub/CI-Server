-- RetailOS security rate limit records
CREATE TABLE IF NOT EXISTS rate_limit_events (
 id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), subject_key TEXT NOT NULL,
 endpoint TEXT NOT NULL, window_started_at TIMESTAMPTZ NOT NULL, request_count INTEGER NOT NULL DEFAULT 1,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_subject_window ON rate_limit_events(subject_key,window_started_at);
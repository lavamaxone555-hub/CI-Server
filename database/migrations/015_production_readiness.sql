-- RetailOS production readiness and deployment checks
CREATE TABLE IF NOT EXISTS production_readiness_checks (
 id TEXT PRIMARY KEY, release_id TEXT, name TEXT NOT NULL, required BOOLEAN NOT NULL DEFAULT TRUE,
 passed BOOLEAN NOT NULL DEFAULT FALSE, details JSONB NOT NULL DEFAULT '{}'::jsonb,
 checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_readiness_release_checked ON production_readiness_checks(release_id,checked_at DESC);
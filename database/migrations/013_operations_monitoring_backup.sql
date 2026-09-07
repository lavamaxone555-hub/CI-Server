-- RetailOS operations: backups and health monitoring
CREATE TABLE IF NOT EXISTS backup_jobs (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), status TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS service_health_checks (
 id TEXT PRIMARY KEY, service TEXT NOT NULL, status TEXT NOT NULL,
 details JSONB NOT NULL DEFAULT '{}'::jsonb, checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_health_service_checked ON service_health_checks(service,checked_at DESC);
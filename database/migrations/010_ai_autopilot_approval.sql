-- RetailOS AI Autopilot and approval workflow
CREATE TABLE IF NOT EXISTS ai_autopilot_actions (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), kind TEXT NOT NULL, risk TEXT NOT NULL,
 payload JSONB NOT NULL DEFAULT '{}'::jsonb, status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS approval_requests (
 id TEXT PRIMARY KEY, action_id TEXT NOT NULL REFERENCES ai_autopilot_actions(id) ON DELETE CASCADE,
 tenant_id TEXT NOT NULL REFERENCES tenants(id), status TEXT NOT NULL DEFAULT 'pending', approved_by TEXT,
 decided_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_status ON approval_requests(tenant_id,status);
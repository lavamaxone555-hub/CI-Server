-- RetailOS AI Copilot insights and forecasts
CREATE TABLE IF NOT EXISTS ai_insights (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), kind TEXT NOT NULL,
 message TEXT NOT NULL, confidence NUMERIC(4,3) NOT NULL CHECK(confidence>=0 AND confidence<=1),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant_created ON ai_insights(tenant_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ai_forecasts (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), metric TEXT NOT NULL,
 predicted_value NUMERIC(14,2) NOT NULL, horizon_days INTEGER NOT NULL CHECK(horizon_days>0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
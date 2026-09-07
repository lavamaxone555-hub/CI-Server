-- RetailOS analytics snapshots
CREATE TABLE IF NOT EXISTS business_daily_metrics (
 tenant_id TEXT NOT NULL REFERENCES tenants(id), branch_id TEXT REFERENCES branches(id), metric_date DATE NOT NULL,
 revenue NUMERIC(14,2) NOT NULL DEFAULT 0, cost NUMERIC(14,2) NOT NULL DEFAULT 0, expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
 orders INTEGER NOT NULL DEFAULT 0, inventory_value NUMERIC(14,2) NOT NULL DEFAULT 0, low_stock_count INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(tenant_id,branch_id,metric_date)
);
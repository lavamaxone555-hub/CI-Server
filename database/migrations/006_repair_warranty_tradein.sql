-- RetailOS repair, warranty and trade-in
CREATE TABLE IF NOT EXISTS repair_orders (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), branch_id TEXT NOT NULL REFERENCES branches(id),
 customer_id TEXT REFERENCES customers(id), status TEXT NOT NULL, device_identifier TEXT, issue TEXT,
 warranty_ends_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_repair_orders_tenant_status ON repair_orders(tenant_id,status);
CREATE TABLE IF NOT EXISTS trade_in_quotes (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), product_id TEXT NOT NULL REFERENCES products(id),
 offered_amount NUMERIC(12,2) NOT NULL CHECK(offered_amount>=0), approved BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

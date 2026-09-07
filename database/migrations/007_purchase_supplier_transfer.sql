-- RetailOS suppliers, purchases and stock transfers
CREATE TABLE IF NOT EXISTS suppliers (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), name TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE TABLE IF NOT EXISTS purchase_orders (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), branch_id TEXT NOT NULL REFERENCES branches(id),
 supplier_id TEXT NOT NULL REFERENCES suppliers(id), status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS stock_transfers (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id),
 from_branch_id TEXT NOT NULL REFERENCES branches(id), to_branch_id TEXT NOT NULL REFERENCES branches(id),
 status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(from_branch_id<>to_branch_id)
);

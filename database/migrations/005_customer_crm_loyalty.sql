-- RetailOS customer CRM and loyalty
CREATE TABLE IF NOT EXISTS customers (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL REFERENCES tenants(id),
 name TEXT NOT NULL,
 phone TEXT,
 email TEXT,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (tenant_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

CREATE TABLE IF NOT EXISTS loyalty_accounts (
 customer_id TEXT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
 tenant_id TEXT NOT NULL REFERENCES tenants(id),
 points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS loyalty_transactions (
 id TEXT PRIMARY KEY,
 customer_id TEXT NOT NULL REFERENCES customers(id),
 tenant_id TEXT NOT NULL REFERENCES tenants(id),
 points_delta INTEGER NOT NULL,
 reason TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

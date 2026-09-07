-- RetailOS product catalog, barcode and tenant-aware inventory
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  barcode TEXT,
  barcode_format TEXT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  cost NUMERIC(12,2) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  track_imei BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (tenant_id, sku)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_barcode ON products (tenant_id, barcode) WHERE barcode IS NOT NULL;

CREATE TABLE IF NOT EXISTS inventory_balances (
  product_id TEXT NOT NULL REFERENCES products(id),
  branch_id TEXT NOT NULL REFERENCES branches(id),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  reorder_point INTEGER NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
  PRIMARY KEY (product_id, branch_id),
  CHECK (reserved <= quantity)
);

ALTER TABLE imei_units ADD COLUMN IF NOT EXISTS tenant_id TEXT;
UPDATE imei_units SET tenant_id = '' WHERE tenant_id IS NULL;
ALTER TABLE imei_units ALTER COLUMN tenant_id SET NOT NULL;

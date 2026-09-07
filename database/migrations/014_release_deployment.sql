-- RetailOS release and deployment history
CREATE TABLE IF NOT EXISTS releases (
 id TEXT PRIMARY KEY, version TEXT NOT NULL, environment TEXT NOT NULL, status TEXT NOT NULL,
 artifact TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS deployments (
 id TEXT PRIMARY KEY, release_id TEXT NOT NULL REFERENCES releases(id), environment TEXT NOT NULL,
 health TEXT NOT NULL, deployed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployments_release ON deployments(release_id,deployed_at DESC);
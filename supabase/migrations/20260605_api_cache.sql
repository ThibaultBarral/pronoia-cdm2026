-- Shared server-side cache for external football API responses.
-- Every user reads from here; we only hit API-Football when a key is stale.
-- Written/read exclusively by the server (service role) → no RLS policies.

CREATE TABLE IF NOT EXISTS api_cache (
  key        text PRIMARY KEY,
  payload    jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS api_cache_expires_idx ON api_cache (expires_at);

ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service-role cache layer touches this table.

-- Lightweight in-app event log for the conversion funnel (welcome offer, contact
-- widget, …). Complements GA4 by surfacing the same signals inside /admin without
-- leaving the app. No PII beyond the (optional) user_id; props is a small JSON.

CREATE TABLE IF NOT EXISTS app_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid,
  name       text NOT NULL,
  props      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Admin reads aggregate by (name, created_at).
CREATE INDEX IF NOT EXISTS app_events_name_created_idx ON app_events (name, created_at DESC);

ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users may only INSERT their own (or anonymous) events; nobody
-- reads via the anon/auth key. The admin reads through the service-role client,
-- which bypasses RLS.
DROP POLICY IF EXISTS app_events_insert_self ON app_events;
CREATE POLICY app_events_insert_self ON app_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

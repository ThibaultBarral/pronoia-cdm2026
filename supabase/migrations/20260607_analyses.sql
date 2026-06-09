-- Per-user analysis history. One row per (user, kind, target); revisiting an
-- analysis upserts the payload and bumps created_at so the most recent surfaces
-- first. Payload is the structured JSON (StoredAnalysis.data).

CREATE TABLE IF NOT EXISTS analyses (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind       text        NOT NULL CHECK (kind IN ('match', 'team')),
  target     text        NOT NULL,          -- match slug or team slug
  title      text        NOT NULL,          -- "France vs Sénégal" / "France"
  home_flag  text,
  away_flag  text,
  payload    jsonb       NOT NULL,          -- StoredAnalysis.data
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, target)
);

CREATE INDEX IF NOT EXISTS analyses_user_recent_idx
  ON analyses (user_id, created_at DESC);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Users read their own history. Writes go through the service role (server),
-- which bypasses RLS — so no INSERT/UPDATE policy is granted.
DROP POLICY IF EXISTS "read own analyses" ON analyses;
CREATE POLICY "read own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

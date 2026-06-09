-- Per-user daily AI analysis counter, enforced atomically by use_ai_credit().
-- The "day" is computed in Europe/Paris so the limit resets at French midnight.

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id uuid  NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  day     date  NOT NULL,                 -- Europe/Paris calendar day
  count   int   NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users may read their own usage (e.g. to show "X analyses left today").
-- Writes go exclusively through use_ai_credit() (SECURITY DEFINER), so no
-- INSERT/UPDATE policy is granted to users.
DROP POLICY IF EXISTS "read own usage" ON ai_usage;
CREATE POLICY "read own usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Atomically consume one credit for the calling user within their daily cap.
-- Returns true if the credit was granted, false if the limit is reached
-- (or the caller is unauthenticated). Single statement => race-safe under
-- concurrent calls thanks to the row lock taken by ON CONFLICT.
CREATE OR REPLACE FUNCTION use_ai_credit(p_limit int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_day   date := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_count int;
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO ai_usage (user_id, day, count)
  VALUES (v_user, v_day, 1)
  ON CONFLICT (user_id, day)
  DO UPDATE SET count = ai_usage.count + 1
    WHERE ai_usage.count < p_limit          -- skip the update once the cap is hit
  RETURNING count INTO v_count;

  -- No row returned => the ON CONFLICT update was filtered out => limit reached.
  RETURN v_count IS NOT NULL;
END;
$$;

-- Callable by signed-in users; the function trusts auth.uid(), never client input.
REVOKE ALL ON FUNCTION use_ai_credit(int) FROM public;
GRANT EXECUTE ON FUNCTION use_ai_credit(int) TO authenticated;

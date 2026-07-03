-- Découverte monthly analysis quota (20/month, resets each calendar month).
-- Only the entry tier (decouverte) is capped; Pro/Elite stay unlimited. The
-- counter is stored on the subscription row and reset lazily by the RPC the
-- first time it's used in a new month (no cron needed).

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS monthly_analyses_used int NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS monthly_period_start  date;

-- Atomically consume one monthly analysis for the calling user, resetting the
-- counter when the stored period is a past calendar month. Returns true if
-- granted, false once the monthly quota is spent (or no subscription row).
CREATE OR REPLACE FUNCTION use_monthly_analysis(p_limit int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user   uuid := auth.uid();
  v_period date := date_trunc('month', now())::date;
  v_used   int;
  v_start  date;
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  -- Lock the caller's row for the read-modify-write.
  SELECT monthly_period_start, monthly_analyses_used
    INTO v_start, v_used
  FROM subscriptions
  WHERE user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false; -- no subscription row → not an active paid user
  END IF;

  -- New calendar month → reset the counter.
  IF v_start IS NULL OR v_start < v_period THEN
    v_used  := 0;
    v_start := v_period;
  END IF;

  IF v_used >= p_limit THEN
    -- Persist the (possibly reset) period even when denying.
    UPDATE subscriptions
      SET monthly_period_start = v_start,
          monthly_analyses_used = v_used
      WHERE user_id = v_user;
    RETURN false;
  END IF;

  UPDATE subscriptions
    SET monthly_period_start = v_start,
        monthly_analyses_used = v_used + 1
    WHERE user_id = v_user;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION use_monthly_analysis(int) FROM public;
GRANT EXECUTE ON FUNCTION use_monthly_analysis(int) TO authenticated;

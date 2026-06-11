-- Win-back tracking: lightweight visit engagement on the existing subscriptions
-- table (reuses user_id / free_analyses_used / plan / vip — no new table, no new
-- PII). Drives the KICKOFF20 win-back pop-up for returning non-subscribers.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS visit_days            int NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_visit_on         date;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS winback_popup_seen_at timestamptz;

-- Count a distinct visit DAY for the calling user, at most once per Europe/Paris
-- day. Returns the (possibly unchanged) visit_days. Creates the row on first use.
CREATE OR REPLACE FUNCTION record_visit()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_days  int;
BEGIN
  IF v_user IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO subscriptions (user_id, plan, visit_days, last_visit_on)
  VALUES (v_user, 'free', 1, v_today)
  ON CONFLICT (user_id)
  DO UPDATE SET visit_days = subscriptions.visit_days + 1,
                last_visit_on = v_today
    WHERE subscriptions.last_visit_on IS DISTINCT FROM v_today
  RETURNING visit_days INTO v_days;

  -- WHERE filtered the update out (already counted today) => read current value.
  IF v_days IS NULL THEN
    SELECT visit_days INTO v_days FROM subscriptions WHERE user_id = v_user;
  END IF;

  RETURN COALESCE(v_days, 0);
END;
$$;

-- Stamp the moment the win-back pop-up was first shown (idempotent: keeps the
-- original timestamp, so the 72h marketing countdown is stable). Returns it.
CREATE OR REPLACE FUNCTION mark_winback_seen()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_at   timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE subscriptions
     SET winback_popup_seen_at = COALESCE(winback_popup_seen_at, now())
   WHERE user_id = v_user
  RETURNING winback_popup_seen_at INTO v_at;

  RETURN v_at;
END;
$$;

REVOKE ALL ON FUNCTION record_visit()      FROM public;
REVOKE ALL ON FUNCTION mark_winback_seen() FROM public;
GRANT EXECUTE ON FUNCTION record_visit()      TO authenticated;
GRANT EXECUTE ON FUNCTION mark_winback_seen() TO authenticated;

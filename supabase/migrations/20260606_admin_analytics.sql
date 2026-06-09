-- Admin analytics: total analyses per user (for the admin panel).

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS analyses_count int NOT NULL DEFAULT 0;

-- Increment the calling user's total analyses counter (any plan).
CREATE OR REPLACE FUNCTION record_analysis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  INSERT INTO subscriptions (user_id, plan, analyses_count)
  VALUES (v_user, 'free', 1)
  ON CONFLICT (user_id)
  DO UPDATE SET analyses_count = subscriptions.analyses_count + 1;
END;
$$;

REVOKE ALL ON FUNCTION record_analysis() FROM public;
GRANT EXECUTE ON FUNCTION record_analysis() TO authenticated;

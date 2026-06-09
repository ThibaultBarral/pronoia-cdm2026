-- Paywall rework: 4 offers (free/pass_cdm/weekly/monthly/lifetime), status-based
-- entitlement, 1 free discovery analysis per user.
-- Evolves the `subscriptions` table (was tier/active based).

-- New columns ---------------------------------------------------------------
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan               text NOT NULL DEFAULT 'free';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status             text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end          timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS free_analyses_used int  NOT NULL DEFAULT 0;

-- Drop the old tier/active model (constraints go with the columns) -----------
ALTER TABLE subscriptions DROP COLUMN IF EXISTS tier;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS active;

-- Constrain the enums --------------------------------------------------------
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD  CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pass_cdm', 'weekly', 'monthly', 'lifetime'));
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD  CONSTRAINT subscriptions_status_check
  CHECK (status IS NULL OR status IN ('active', 'trialing', 'expired', 'canceled'));

-- RLS unchanged: users read their own row; writes go through service role
-- (webhook / restore) and the SECURITY DEFINER function below.

-- Atomically consume one free discovery analysis for the calling user.
-- Returns true if granted, false once the free quota is spent. Creates the
-- user's row (plan='free') on first use.
CREATE OR REPLACE FUNCTION use_free_analysis(p_limit int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_used int;
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO subscriptions (user_id, plan, free_analyses_used)
  VALUES (v_user, 'free', 1)
  ON CONFLICT (user_id)
  DO UPDATE SET free_analyses_used = subscriptions.free_analyses_used + 1
    WHERE subscriptions.free_analyses_used < p_limit
  RETURNING free_analyses_used INTO v_used;

  -- No row returned => the ON CONFLICT update was filtered out => quota spent.
  RETURN v_used IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION use_free_analysis(int) FROM public;
GRANT EXECUTE ON FUNCTION use_free_analysis(int) TO authenticated;

-- Old per-day credit function is no longer used by the app.
DROP FUNCTION IF EXISTS use_ai_credit(integer);

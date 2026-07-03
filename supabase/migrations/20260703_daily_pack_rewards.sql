-- Retention: "La pochette du jour" (daily reward) + share-to-unlock.
-- Free users grow a bonus_credits balance (extra free analyses) by opening a
-- daily pack and by sharing their prediction card. Rare pack rewards grant
-- temporary Pro access via bonus_access_until (no Whop involved).

-- 1) Credit balance + temporary access on the subscription row -----------------
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS bonus_credits      int NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS bonus_access_until timestamptz;

-- 2) One row per user per day per reward kind (enforces 1×/day in the DB) -------
CREATE TABLE IF NOT EXISTS daily_rewards (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_date date NOT NULL DEFAULT current_date,
  kind        text NOT NULL CHECK (kind IN ('pack', 'share')),
  reward      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, reward_date, kind)
);
-- Server-only: RLS on with no policy → clients can't read/write it directly.
-- Reads go through server actions (service role); writes through the RPCs below.
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

-- 3) Free-analysis quota now includes earned bonus credits ----------------------
-- Effective free limit = p_limit (base "1er match offert") + bonus_credits.
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
    WHERE subscriptions.free_analyses_used < p_limit + subscriptions.bonus_credits
  RETURNING free_analyses_used INTO v_used;

  RETURN v_used IS NOT NULL;
END;
$$;

-- 4) Claim the daily pack: atomic (1×/day) insert + grant. The reward is rolled
--    server-side (in the action) and passed in; this only commits it once/day.
--    Returns true if this call claimed today, false if already claimed.
CREATE OR REPLACE FUNCTION claim_daily_pack(p_reward text, p_credits int, p_access_days int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO daily_rewards (user_id, reward_date, kind, reward)
  VALUES (v_user, current_date, 'pack', p_reward)
  ON CONFLICT (user_id, reward_date, kind) DO NOTHING;

  IF NOT FOUND THEN
    RETURN false; -- already opened the pack today
  END IF;

  INSERT INTO subscriptions (user_id, plan, bonus_credits, bonus_access_until)
  VALUES (
    v_user, 'free', p_credits,
    CASE WHEN p_access_days > 0 THEN now() + make_interval(days => p_access_days) ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    bonus_credits = subscriptions.bonus_credits + p_credits,
    bonus_access_until = CASE
      WHEN p_access_days > 0
        THEN GREATEST(COALESCE(subscriptions.bonus_access_until, now()), now() + make_interval(days => p_access_days))
      ELSE subscriptions.bonus_access_until
    END;

  RETURN true;
END;
$$;

-- 5) Share reward: +1 credit, capped once/day. Returns true if granted. --------
CREATE OR REPLACE FUNCTION grant_share_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO daily_rewards (user_id, reward_date, kind, reward)
  VALUES (v_user, current_date, 'share', '+1')
  ON CONFLICT (user_id, reward_date, kind) DO NOTHING;

  IF NOT FOUND THEN
    RETURN false; -- already got the share credit today
  END IF;

  INSERT INTO subscriptions (user_id, plan, bonus_credits)
  VALUES (v_user, 'free', 1)
  ON CONFLICT (user_id) DO UPDATE SET
    bonus_credits = subscriptions.bonus_credits + 1;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION claim_daily_pack(text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION claim_daily_pack(text, int, int) TO authenticated;
REVOKE ALL ON FUNCTION grant_share_credit() FROM public;
GRANT EXECUTE ON FUNCTION grant_share_credit() TO authenticated;

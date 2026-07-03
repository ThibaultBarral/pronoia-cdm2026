-- Adapt the daily pack for PAID subscribers: "jours de Pro offerts" must extend
-- their access BEYOND their current paid period (real free time), not just from
-- now() (which would be redundant while their subscription is active).
-- Replaces claim_daily_pack so the access extension is based on the later of
-- {existing bonus, current_period_end, now}. Free users have no period_end → now.

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
      WHEN p_access_days > 0 THEN
        GREATEST(
          COALESCE(subscriptions.bonus_access_until, now()),
          COALESCE(subscriptions.current_period_end, now()),
          now()
        ) + make_interval(days => p_access_days)
      ELSE subscriptions.bonus_access_until
    END;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION claim_daily_pack(text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION claim_daily_pack(text, int, int) TO authenticated;

-- Elofoot-mirror pricing grid: tier × duration.
-- Widens the plan CHECK constraint so the Whop webhook can persist the new plan
-- keys (decouverte, elite, pro_weekly, elite_weekly) alongside the existing/legacy
-- ones. Also re-adds `essential`, which was in lib/plans.ts but MISSING from the
-- constraint (a pre-existing gap that would reject Essential membership writes).
-- Safe/idempotent: drops and re-adds the constraint with the full value set.
-- Activation is gated separately (new offers checkout only once their WHOP_PLAN_*
-- env vars are configured).

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD  CONSTRAINT subscriptions_plan_check
  CHECK (plan IN (
    'free',
    -- current grid
    'decouverte', 'monthly', 'elite', 'pro_weekly', 'elite_weekly', 'lifetime',
    -- legacy (grandfathered)
    'essential', 'weekly', 'season', 'pass_cdm'
  ));

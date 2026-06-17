-- Add the "Pass Saison" plan (one-time pass covering the CDM + 2026/27 season).
-- Widens the plan CHECK constraint so the Whop webhook can persist `season`
-- memberships. Safe/idempotent: re-adds the constraint with the extra value.
-- Activation is gated separately (the offer is `hidden` in lib/plans.ts until the
-- Whop product + WHOP_PLAN_SEASON env are configured).

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD  CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pass_cdm', 'weekly', 'monthly', 'season', 'lifetime'));

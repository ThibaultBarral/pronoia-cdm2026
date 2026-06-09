-- Subscriptions synced from Whop via webhooks.
-- One row per user; written only by the webhook handler (service role).

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id              uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  active               boolean NOT NULL DEFAULT false,  -- entitlement, driven by webhook events
  tier                 text CHECK (tier IN ('starter', 'pro', 'lifetime')),
  whop_status          text,            -- raw Whop membership status (display/debug)
  whop_membership_id   text,
  whop_plan_id         text,
  manage_url           text,            -- Whop-hosted "manage subscription" link
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  current_period_end   timestamptz,     -- null for Lifetime (no renewal)
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_membership_idx
  ON subscriptions (whop_membership_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users may read their own subscription row. Writes go through the service
-- role (webhook), which bypasses RLS — so no INSERT/UPDATE policy is granted.
DROP POLICY IF EXISTS "read own subscription" ON subscriptions;
CREATE POLICY "read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

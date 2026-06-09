-- VIP / comp access: a free, admin-granted full access, independent from paid
-- plans and from the admin role. A user with vip=true has full access (no paywall)
-- without any Whop payment. Toggled from the admin panel.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS vip boolean NOT NULL DEFAULT false;

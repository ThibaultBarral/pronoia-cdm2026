-- Token-level cost tracking for every REAL Claude generation.
-- Analyses are shared-cached (one generation per match/team/day/profile serves
-- many viewers), so a row is written only on a cache MISS → this reflects the
-- true money cost, not per-view cost. Powers the separate "Coûts & rentabilité"
-- admin at /admin/couts (kept apart from the product analytics admin).

CREATE TABLE IF NOT EXISTS ai_cost_log (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at             timestamptz   NOT NULL DEFAULT now(),
  kind                   text          NOT NULL,            -- 'match' | 'team' | 'chat' | 'bets'
  model                  text          NOT NULL,
  input_tokens           int           NOT NULL DEFAULT 0,  -- uncached input tokens
  output_tokens          int           NOT NULL DEFAULT 0,
  cache_creation_tokens  int           NOT NULL DEFAULT 0,  -- written to cache (~1.25x input)
  cache_read_tokens      int           NOT NULL DEFAULT 0,  -- served from cache (~0.1x input)
  cost_usd               numeric(12,6) NOT NULL DEFAULT 0,  -- computed from model pricing
  user_id                uuid          REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ai_cost_log_created_at_idx ON ai_cost_log (created_at);
CREATE INDEX IF NOT EXISTS ai_cost_log_user_id_idx   ON ai_cost_log (user_id);

ALTER TABLE ai_cost_log ENABLE ROW LEVEL SECURITY;
-- No policies: written + read exclusively through the service-role client
-- (server-only). Users never touch this table.

-- Credit balance checkpoints. The admin enters the REAL balance read from
-- console.anthropic.com at a moment in time; remaining ≈ that balance minus the
-- cost logged since. Re-entering a fresh reading re-anchors and self-corrects
-- any drift between our estimate and Anthropic's actual billing.
CREATE TABLE IF NOT EXISTS ai_credit_checkpoint (
  id          bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  balance_usd numeric(12,2) NOT NULL,
  note        text
);

ALTER TABLE ai_credit_checkpoint ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

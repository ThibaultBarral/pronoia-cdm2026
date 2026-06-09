-- Keep only the most recent bankroll per user before adding the constraint
DELETE FROM bankrolls
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM bankrolls
  ORDER BY user_id, created_at DESC
);

-- Enforce 1 bankroll per user at the DB level
ALTER TABLE bankrolls
  ADD CONSTRAINT bankrolls_user_id_unique UNIQUE (user_id);

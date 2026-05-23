ALTER TABLE bankrolls
  ADD COLUMN IF NOT EXISTS playstyle text
  CHECK (playstyle IN ('safe', 'balanced', 'opportunist', 'aggressive'));

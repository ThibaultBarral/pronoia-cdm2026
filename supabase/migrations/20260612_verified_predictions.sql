-- Track record : prédictions de l'IA Copafever, vérifiées contre le résultat réel.
-- Socle des features "bloc confiance" (paywall), modale célébration et page
-- publique /track-record. Lecture publique (on PROUVE), écriture service-role.

CREATE TABLE IF NOT EXISTS verified_predictions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     text NOT NULL,
  match_label  text,
  home_flag    text,
  away_flag    text,
  market       text NOT NULL,                 -- "1X2" | "Over 2.5" | "BTTS" | …
  selection    text NOT NULL,                 -- "France" | "Over 2.5" | "Oui" | …
  odds         numeric,                        -- cote réelle au moment de l'analyse
  confidence   text,                           -- Faible | Moyen | Élevé | Très élevé
  status       text NOT NULL DEFAULT 'pending' -- pending | won | lost | void
                 CHECK (status IN ('pending', 'won', 'lost', 'void')),
  phase        text,                           -- "Phase de groupes" | …
  result_note  text,
  match_date   date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  settled_at   timestamptz
);

CREATE INDEX IF NOT EXISTS verified_predictions_status_idx ON verified_predictions (status);
CREATE INDEX IF NOT EXISTS verified_predictions_match_idx ON verified_predictions (match_id);

ALTER TABLE verified_predictions ENABLE ROW LEVEL SECURITY;

-- Public read (track record is public proof). Writes go through the service role.
DROP POLICY IF EXISTS "verified_predictions public read" ON verified_predictions;
CREATE POLICY "verified_predictions public read"
  ON verified_predictions FOR SELECT USING (true);

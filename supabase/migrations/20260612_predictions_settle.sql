-- Feature 5 : auto-settlement des prédictions vérifiées.
-- Colonnes pour régler automatiquement (comparer le pick au score réel) + une
-- prédiction unique par match (le pick principal de l'IA).

ALTER TABLE verified_predictions ADD COLUMN IF NOT EXISTS pick_side  text; -- home|away|over|under|btts_yes|btts_no
ALTER TABLE verified_predictions ADD COLUMN IF NOT EXISTS home_api_id int;
ALTER TABLE verified_predictions ADD COLUMN IF NOT EXISTS away_api_id int;

-- Une seule prédiction (le pick principal) par match.
CREATE UNIQUE INDEX IF NOT EXISTS verified_predictions_match_uniq
  ON verified_predictions (match_id);

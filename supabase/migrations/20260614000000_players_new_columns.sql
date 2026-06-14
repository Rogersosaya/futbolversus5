-- ============================================================
-- FUTDB — nuevas columnas en `players` (Transfermarkt)
--   player_short_name        nombre corto, ej. "K. Mbappé"
--   jersey                   número de dorsal actual
--   club_debut               fecha de debut en el club actual
--   other_positions          otras posiciones, ej. "Left Winger, Attacking Midfield"
--   market_value_determined  fecha en que TM fijó el valor de mercado actual
-- Los valores se cargan aparte vía \copy + UPDATE (igual que la carga inicial).
-- ============================================================

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS player_short_name       TEXT,
  ADD COLUMN IF NOT EXISTS jersey                  INTEGER,
  ADD COLUMN IF NOT EXISTS club_debut              DATE,
  ADD COLUMN IF NOT EXISTS other_positions         TEXT,
  ADD COLUMN IF NOT EXISTS market_value_determined DATE;

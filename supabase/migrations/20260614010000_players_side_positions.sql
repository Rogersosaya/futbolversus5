-- ============================================================
-- FUTDB — reemplaza `other_positions` por columnas de lado/posición.
--   first_side_position   lado/posición principal, ej. "RW", "CM"
--   second_side_position  segundo lado/posición, ej. "LW", "AM"
-- Valores cargados aparte vía \copy + UPDATE.
-- ============================================================

ALTER TABLE players DROP COLUMN IF EXISTS other_positions;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS first_side_position  TEXT,
  ADD COLUMN IF NOT EXISTS second_side_position TEXT;

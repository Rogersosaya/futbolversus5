-- ============================================================
-- FUTDB — `players`:
--   1) renombra sub_position -> main_position (posición principal)
--   2) expande las siglas de first/second_side_position al nombre completo
--      (LW -> "Left Winger", AM -> "Attacking Midfield", …) para que usen el
--      mismo vocabulario que main_position.
-- El índice idx_players_position (position, sub_position) sigue a la columna
-- renombrada automáticamente.
-- ============================================================

ALTER TABLE players RENAME COLUMN sub_position TO main_position;

WITH pos_map(code, full_name) AS (
  VALUES
    ('AM', 'Attacking Midfield'),
    ('CB', 'Centre-Back'),
    ('CF', 'Centre-Forward'),
    ('CM', 'Central Midfield'),
    ('DM', 'Defensive Midfield'),
    ('GK', 'Goalkeeper'),
    ('LB', 'Left-Back'),
    ('LM', 'Left Midfield'),
    ('LW', 'Left Winger'),
    ('RB', 'Right-Back'),
    ('RM', 'Right Midfield'),
    ('RW', 'Right Winger'),
    ('SS', 'Second Striker'),
    ('SW', 'Sweeper')
)
UPDATE players p
SET first_side_position = m.full_name
FROM pos_map m
WHERE p.first_side_position = m.code;

WITH pos_map(code, full_name) AS (
  VALUES
    ('AM', 'Attacking Midfield'),
    ('CB', 'Centre-Back'),
    ('CF', 'Centre-Forward'),
    ('CM', 'Central Midfield'),
    ('DM', 'Defensive Midfield'),
    ('GK', 'Goalkeeper'),
    ('LB', 'Left-Back'),
    ('LM', 'Left Midfield'),
    ('LW', 'Left Winger'),
    ('RB', 'Right-Back'),
    ('RM', 'Right Midfield'),
    ('RW', 'Right Winger'),
    ('SS', 'Second Striker'),
    ('SW', 'Sweeper')
)
UPDATE players p
SET second_side_position = m.full_name
FROM pos_map m
WHERE p.second_side_position = m.code;

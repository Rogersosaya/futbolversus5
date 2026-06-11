-- ~2,269 jugadores tienen como club actual un club menor que no esta entre los
-- 796 de clubs (mismo caso que player_clubs.club_id, que ya va sin FK).
-- Se conserva el id (y current_club_name como texto); se quita la restriccion.
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_current_club_id_fkey;

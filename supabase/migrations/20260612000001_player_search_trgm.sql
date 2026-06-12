-- Accent-insensitive substring search over players.name for the in-game
-- search box ("vinicius" must match "Vinícius Júnior"). unaccent() is STABLE,
-- not IMMUTABLE, so it can't power an expression index directly — the standard
-- fix is an IMMUTABLE wrapper that pins the dictionary.

CREATE EXTENSION IF NOT EXISTS pg_trgm  WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.f_unaccent(text)
  RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  SET search_path = ''
AS $$ SELECT extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- gin_trgm_ops supports ILIKE '%…%' directly.
CREATE INDEX IF NOT EXISTS "players_name_unaccent_trgm_idx"
  ON "players" USING GIN (public.f_unaccent("name") extensions.gin_trgm_ops);

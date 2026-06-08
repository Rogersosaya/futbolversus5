-- Relate profiles to leagues: the league the president's club currently
-- competes in. Defaults to Liga 1 (Perú); ascends as market value grows.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS league_id text DEFAULT 'pe'
    REFERENCES public.leagues(id) ON DELETE SET NULL;

-- Backfill existing rows to the starting league.
UPDATE public.profiles SET league_id = 'pe' WHERE league_id IS NULL;

CREATE INDEX IF NOT EXISTS profiles_league_id_idx ON public.profiles (league_id);

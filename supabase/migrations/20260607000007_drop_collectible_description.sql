-- Drop the unused `description` column from collectibles.
ALTER TABLE public.collectibles DROP COLUMN IF EXISTS description;

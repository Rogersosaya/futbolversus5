-- League progression ("Ruta de Ligas") + unlockable collectibles
-- (escudos / avatares / estadios). Modelled after Clash Royale arenas + cards:
-- the player ascends leagues by market value and unlocks the collectibles
-- attached to each league.

-- Enums -----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collectible_kind') THEN
    CREATE TYPE "collectible_kind" AS ENUM ('CREST', 'AVATAR', 'STADIUM');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rarity') THEN
    CREATE TYPE "rarity" AS ENUM ('LEGEND', 'EPIC', 'RARE', 'COMMON');
  END IF;
END$$;

-- leagues ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "leagues" (
  "id"               TEXT        PRIMARY KEY,
  "code"             TEXT        NOT NULL UNIQUE,
  "name"             TEXT        NOT NULL,
  "country"          TEXT        NOT NULL,
  "country_code"     TEXT        NOT NULL,
  "image_url"        TEXT        NOT NULL,
  "tier"             INTEGER     NOT NULL UNIQUE,
  "min_market_value" INTEGER     NOT NULL,
  "max_market_value" INTEGER,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- collectibles ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "collectibles" (
  "id"            TEXT             PRIMARY KEY,
  "kind"          "collectible_kind" NOT NULL,
  "name"          TEXT             NOT NULL,
  "description"   TEXT             NOT NULL,
  "art_key"       TEXT,
  "image_url"     TEXT,
  "gradient_from" TEXT,
  "gradient_to"   TEXT,
  "rarity"        "rarity"         NOT NULL DEFAULT 'COMMON',
  "price"         INTEGER          NOT NULL DEFAULT 0,
  "is_starter"    BOOLEAN          NOT NULL DEFAULT false,
  "sort_order"    INTEGER          NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMPTZ      NOT NULL DEFAULT now(),
  "league_id"     TEXT             NOT NULL REFERENCES "leagues"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "collectibles_league_id_idx" ON "collectibles" ("league_id");
CREATE INDEX IF NOT EXISTS "collectibles_kind_idx" ON "collectibles" ("kind");

-- Row Level Security ----------------------------------------------------------
-- These are public, read-only catalogue tables. Enable RLS and grant SELECT to
-- everyone; no client-side writes (seeded server-side / via migrations).
ALTER TABLE "leagues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collectibles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leagues_select_all" ON "leagues";
CREATE POLICY "leagues_select_all" ON "leagues"
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "collectibles_select_all" ON "collectibles";
CREATE POLICY "collectibles_select_all" ON "collectibles"
  FOR SELECT TO anon, authenticated USING (true);

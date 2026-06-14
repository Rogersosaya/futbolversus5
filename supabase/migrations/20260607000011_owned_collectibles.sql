-- Ownership ledger for collectibles (escudos / avatares / estadios).
-- Until now "owned" meant "currently equipped": the profile only kept one
-- avatar_id / stadium_id / shield_id and buying replaced the previous one.
-- This table records every collectible a player has acquired (bought or granted
-- as a free starter pick), so they keep a collection and choose which one of
-- each kind to use. The profile's *_id columns still point to the ACTIVE one.

-- owned_collectibles -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "owned_collectibles" (
  "id"             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "profile_id"     UUID        NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "collectible_id" TEXT        NOT NULL REFERENCES "collectibles"("id") ON DELETE CASCADE,
  "acquired_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("profile_id", "collectible_id")
);

CREATE INDEX IF NOT EXISTS "owned_collectibles_profile_id_idx"
  ON "owned_collectibles" ("profile_id");

-- Backfill: every collectible a player currently has equipped is already theirs,
-- so seed the ledger with their active avatar / stadium / shield. Without this,
-- existing players would see their equipped items as "not owned" in the Mercado.
INSERT INTO "owned_collectibles" ("profile_id", "collectible_id")
SELECT p.id, c.collectible_id
FROM "profiles" p
CROSS JOIN LATERAL (
  VALUES (p.avatar_id), (p.stadium_id), (p.shield_id)
) AS c(collectible_id)
WHERE c.collectible_id IS NOT NULL
ON CONFLICT ("profile_id", "collectible_id") DO NOTHING;

-- Row Level Security -----------------------------------------------------------
-- A player may read only their own ledger. Writes happen server-side via Prisma
-- (privileged DATABASE_URL connection), so no insert/update policies are needed.
ALTER TABLE "owned_collectibles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owned_select_own" ON "owned_collectibles";
CREATE POLICY "owned_select_own" ON "owned_collectibles"
  FOR SELECT TO authenticated USING (auth.uid() = "profile_id");

-- "Once Mundialista" game state. The 22-cell board is shared: each claim is a
-- row in match_claims (first valid claim wins via the unique constraint) and a
-- player's score is the count of their claims — derived, never stored, so it
-- survives retries and reloads. Per-seat nation-cycle progress and the 5s
-- nation-change penalty live as columns on match_rooms. All writes go through
-- server actions (privileged DATABASE_URL); realtime is Broadcast-only, so no
-- publication / replica identity here.

-- New terminal state: FINISHED = played to completion (CLOSED stays =
-- abandoned). Safe inside the migration transaction as long as no row is
-- written with it here (Postgres 12+); the app only uses it at runtime.
ALTER TYPE "match_room_status" ADD VALUE IF NOT EXISTS 'FINISHED';

-- Game-state columns (server-authoritative).
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "nation_cycle"        INTEGER[]   NOT NULL DEFAULT '{}';
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "host_nation_idx"     INTEGER     NOT NULL DEFAULT 0;
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "guest_nation_idx"    INTEGER     NOT NULL DEFAULT 0;
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "host_penalty_until"  TIMESTAMPTZ;
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "guest_penalty_until" TIMESTAMPTZ;
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "finished_at"         TIMESTAMPTZ;

-- match_claims ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "match_claims" (
  "id"         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "room_id"    TEXT        NOT NULL REFERENCES "match_rooms"("id") ON DELETE CASCADE,
  "cell_id"    TEXT        NOT NULL,
  "player_id"  INTEGER     NOT NULL REFERENCES "players"("player_id"),
  "claimed_by" UUID        NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Cell race: the first valid claim wins, the loser rolls back untouched.
  UNIQUE ("room_id", "cell_id"),
  -- A footballer can appear at most once per board.
  UNIQUE ("room_id", "player_id")
);

CREATE INDEX IF NOT EXISTS "match_claims_room_idx" ON "match_claims" ("room_id");

-- RLS: members-only SELECT, mirroring match_rooms. No write policies (server
-- actions only).
ALTER TABLE "match_claims" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_claims_select_members" ON "match_claims";
CREATE POLICY "match_claims_select_members" ON "match_claims"
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "match_rooms" r
    WHERE r."id" = "match_claims"."room_id"
      AND (auth.uid() = r."host_id" OR auth.uid() = r."guest_id")
  ));

GRANT SELECT ON TABLE "match_claims" TO authenticated;

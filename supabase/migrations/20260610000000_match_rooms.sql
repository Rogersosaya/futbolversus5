-- Friendly-match rooms + invites. A room is a persistent 2-seat lobby created
-- when the host presses JUGAR on /amistoso. The guest seat is claimed
-- atomically (first click wins) either via a friend invite or the share link.
-- Both tables are published over Supabase Realtime (Postgres Changes); RLS
-- SELECT policies scope delivery to the two players involved. All writes go
-- through server actions (privileged DATABASE_URL), so no write policies.

-- enums ----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_room_status') THEN
    CREATE TYPE "match_room_status" AS ENUM ('OPEN', 'READY', 'CLOSED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_invite_status') THEN
    CREATE TYPE "match_invite_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');
  END IF;
END$$;

-- match_rooms ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "match_rooms" (
  "id"         TEXT                PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "code"       TEXT                NOT NULL UNIQUE,
  "status"     "match_room_status" NOT NULL DEFAULT 'OPEN',
  "game_id"    INTEGER             REFERENCES "Game"("id") ON DELETE SET NULL,
  "difficulty" TEXT,
  "host_id"    UUID                NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "guest_id"   UUID                REFERENCES "profiles"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ         NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ         NOT NULL DEFAULT now(),
  CHECK ("host_id" <> "guest_id")
);

CREATE INDEX IF NOT EXISTS "match_rooms_host_status_idx" ON "match_rooms" ("host_id", "status");
CREATE INDEX IF NOT EXISTS "match_rooms_guest_idx"       ON "match_rooms" ("guest_id");

-- match_invites --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "match_invites" (
  "id"           TEXT                  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "room_id"      TEXT                  NOT NULL REFERENCES "match_rooms"("id") ON DELETE CASCADE,
  "sender_id"    UUID                  NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "receiver_id"  UUID                  NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "status"       "match_invite_status" NOT NULL DEFAULT 'PENDING',
  "created_at"   TIMESTAMPTZ           NOT NULL DEFAULT now(),
  "responded_at" TIMESTAMPTZ,
  UNIQUE ("room_id", "receiver_id"),
  CHECK ("sender_id" <> "receiver_id")
);

CREATE INDEX IF NOT EXISTS "match_invites_receiver_status_idx" ON "match_invites" ("receiver_id", "status");
CREATE INDEX IF NOT EXISTS "match_invites_sender_status_idx"   ON "match_invites" ("sender_id", "status");

-- Row Level Security ----------------------------------------------------------
ALTER TABLE "match_rooms"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_invites" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_rooms_select_members" ON "match_rooms";
CREATE POLICY "match_rooms_select_members" ON "match_rooms"
  FOR SELECT TO authenticated
  USING (auth.uid() = "host_id" OR auth.uid() = "guest_id");

DROP POLICY IF EXISTS "match_invites_select_involved" ON "match_invites";
CREATE POLICY "match_invites_select_involved" ON "match_invites"
  FOR SELECT TO authenticated
  USING (auth.uid() = "sender_id" OR auth.uid() = "receiver_id");

-- Realtime delivery needs table-level SELECT for the subscribing role (RLS
-- still scopes which rows each client receives).
GRANT SELECT ON TABLE "match_rooms"   TO authenticated;
GRANT SELECT ON TABLE "match_invites" TO authenticated;

-- REPLICA IDENTITY FULL so UPDATE payloads carry every column and client-side
-- filters (id / sender_id / receiver_id) keep matching on all events.
ALTER TABLE "match_rooms"   REPLICA IDENTITY FULL;
ALTER TABLE "match_invites" REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'match_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "match_rooms";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'match_invites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "match_invites";
  END IF;
END$$;

-- Match start flow. Once both players are present in a READY lobby the match
-- sequence begins: `ready_at` is stamped (single shared timestamp the clients
-- derive the whole synchronized cinematic from), and when the cinematic ends
-- the room is promoted to IN_GAME (`started_at`). Status lifecycle becomes
-- OPEN → READY → IN_GAME → CLOSED, with READY able to fall back to OPEN if the
-- guest leaves before kickoff (ready_at is cleared then).

-- New enum value. Safe inside the migration transaction as long as no row is
-- written with it here (Postgres 12+); the app only uses it at runtime.
ALTER TYPE "match_room_status" ADD VALUE IF NOT EXISTS 'IN_GAME';

-- Shared timeline anchors (server clock — never client clocks).
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "ready_at"   TIMESTAMPTZ;
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMPTZ;

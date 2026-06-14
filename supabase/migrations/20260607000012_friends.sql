-- Social graph: friend requests + friendships, plus career stats on profiles.
-- The matchmaking screen and friend cards show NIVEL / PODER / VICT, so the
-- profile gains real columns (updated later when the match system exists).
-- Friend requests are delivered in real time via Supabase Realtime (Postgres
-- Changes); RLS SELECT policies are what let an authenticated client receive
-- only its own rows. Writes happen server-side via Prisma (privileged
-- DATABASE_URL connection), so no insert/update policies are needed.

-- profiles: career stats ---------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "level"  integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "power"  integer NOT NULL DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "wins"   integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "played" integer NOT NULL DEFAULT 0;

-- enum ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_request_status') THEN
    CREATE TYPE "friend_request_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
  END IF;
END$$;

-- friend_requests ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "friend_requests" (
  "id"           TEXT                    PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sender_id"    UUID                    NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "receiver_id"  UUID                    NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "status"       "friend_request_status" NOT NULL DEFAULT 'PENDING',
  "created_at"   TIMESTAMPTZ             NOT NULL DEFAULT now(),
  "responded_at" TIMESTAMPTZ,
  UNIQUE ("sender_id", "receiver_id"),
  CHECK ("sender_id" <> "receiver_id")
);

CREATE INDEX IF NOT EXISTS "friend_requests_receiver_status_idx"
  ON "friend_requests" ("receiver_id", "status");

-- friendships (canonical single row: user_a_id < user_b_id) ----------------
CREATE TABLE IF NOT EXISTS "friendships" (
  "id"         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_a_id"  UUID        NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "user_b_id"  UUID        NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("user_a_id", "user_b_id"),
  CHECK ("user_a_id" < "user_b_id")
);

CREATE INDEX IF NOT EXISTS "friendships_user_b_idx" ON "friendships" ("user_b_id");

-- Row Level Security -------------------------------------------------------
ALTER TABLE "friend_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "friendships"     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friend_requests_select_involved" ON "friend_requests";
CREATE POLICY "friend_requests_select_involved" ON "friend_requests"
  FOR SELECT TO authenticated
  USING (auth.uid() = "sender_id" OR auth.uid() = "receiver_id");

DROP POLICY IF EXISTS "friendships_select_involved" ON "friendships";
CREATE POLICY "friendships_select_involved" ON "friendships"
  FOR SELECT TO authenticated
  USING (auth.uid() = "user_a_id" OR auth.uid() = "user_b_id");

-- Realtime -----------------------------------------------------------------
-- Publish both tables so clients get live INSERT/UPDATE (filtered by RLS).
-- REPLICA IDENTITY FULL makes UPDATE/DELETE payloads carry sender/receiver so
-- the client filter (receiver_id=eq.<me>) still matches on those events.
ALTER TABLE "friend_requests" REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'friend_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "friend_requests";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "friendships";
  END IF;
END$$;

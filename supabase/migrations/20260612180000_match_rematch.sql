-- Rematch handshake on FINISHED rooms. Each seat stamps its request; when both
-- are stamped a brand-new room is created (fresh deck, fresh clock — a fully
-- separate match, so history keeps one row per played game) and its code is
-- published here exactly once for both clients to follow.
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "host_rematch_at"  TIMESTAMPTZ;
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "guest_rematch_at" TIMESTAMPTZ;
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "rematch_code"     TEXT;

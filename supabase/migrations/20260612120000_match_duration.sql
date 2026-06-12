-- Host-selectable match duration for "Once Mundialista". 0 = no time limit
-- (the match then ends only by board-full or unreachable-lead). NOT NULL with
-- a 120s default keeps legacy rooms unambiguous.
ALTER TABLE "match_rooms" ADD COLUMN IF NOT EXISTS "duration_s" INTEGER NOT NULL DEFAULT 120;

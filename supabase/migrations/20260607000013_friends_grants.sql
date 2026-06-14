-- Ensure the authenticated role can SELECT the social tables. RLS still scopes
-- which rows are visible, but Realtime (Postgres Changes) only delivers rows
-- the subscribing role has table-level SELECT on. Supabase usually grants this
-- by default for new public tables, but make it explicit so realtime delivery
-- of friend requests/friendships is guaranteed regardless of Data API settings.
GRANT SELECT ON TABLE "friend_requests" TO authenticated;
GRANT SELECT ON TABLE "friendships"     TO authenticated;

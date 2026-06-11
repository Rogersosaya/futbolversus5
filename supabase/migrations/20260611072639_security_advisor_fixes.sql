-- Arreglos de los advisors de seguridad/rendimiento de Supabase.

-- 1) RLS en "Game" (catalogo de minijuegos): mismo patron de solo lectura
--    que leagues/collectibles. Escrituras solo desde el servidor (postgres).
ALTER TABLE "Game" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_select_all" ON "Game"
  FOR SELECT TO anon, authenticated USING (true);

-- 2) handle_new_user() es SECURITY DEFINER y era ejecutable via RPC por
--    anon/authenticated. Solo la dispara el trigger de auth.users.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 3) auth.uid() -> (select auth.uid()) en politicas RLS: se evalua una vez
--    por consulta (initplan) en lugar de una vez por fila.
--    De paso, las politicas de profiles pasan de TO public a TO authenticated
--    (anon nunca tiene uid, asi que el comportamiento no cambia).
ALTER POLICY profiles_select_own ON profiles
  TO authenticated USING ((SELECT auth.uid()) = id);
ALTER POLICY profiles_insert_own ON profiles
  TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
ALTER POLICY profiles_update_own ON profiles
  TO authenticated USING ((SELECT auth.uid()) = id);
ALTER POLICY owned_select_own ON owned_collectibles
  USING ((SELECT auth.uid()) = profile_id);
ALTER POLICY friend_requests_select_involved ON friend_requests
  USING ((SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = receiver_id);
ALTER POLICY friendships_select_involved ON friendships
  USING ((SELECT auth.uid()) = user_a_id OR (SELECT auth.uid()) = user_b_id);
ALTER POLICY match_rooms_select_members ON match_rooms
  USING ((SELECT auth.uid()) = host_id OR (SELECT auth.uid()) = guest_id);
ALTER POLICY match_invites_select_involved ON match_invites
  USING ((SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = receiver_id);
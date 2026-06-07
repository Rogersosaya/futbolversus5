// Reads: regular async functions for use in Server Components (no "use server" needed)
import { createServerClient } from "@/lib/supabase-server";
import type { Game } from "@/generated/prisma/client";

export async function getGames(): Promise<Game[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("Game").select("*").order("id");
  if (error) throw new Error(error.message);
  return (data ?? []) as Game[];
}

export async function getGameById(id: number): Promise<Game | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("Game")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Game;
}

"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { Game } from "@/generated/prisma/client";

// Example mutation: use server actions only for writes
export async function createGame(game: Omit<Game, "id">) {
  const supabase = createServerClient();
  const { error } = await supabase.from("Game").insert(game);
  if (error) throw new Error(error.message);
  revalidatePath("/amistoso");
}

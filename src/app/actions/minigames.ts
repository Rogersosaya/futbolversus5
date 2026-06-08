"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { Game } from "@/generated/prisma/client";

// Example mutation: use server actions only for writes.
export async function createGame(game: Game) {
  await prisma.game.create({ data: game });
  revalidatePath("/amistoso");
}

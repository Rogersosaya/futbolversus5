// Game reads via Prisma. Plain async functions for use in Server Components.
import { prisma } from "@/lib/prisma";
import type { Game } from "@/generated/prisma/client";

export async function getGames(): Promise<Game[]> {
  return prisma.game.findMany({ orderBy: { id: "asc" } });
}

export async function getGameById(id: number): Promise<Game | null> {
  return prisma.game.findUnique({ where: { id } });
}

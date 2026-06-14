// Match-history reads via Prisma. Plain async functions for Server
// Components — NOT a "use server" file (trusted userId params are fine here).
import { prisma } from "@/lib/prisma";
import { toCards } from "@/actions/friends";
import { DIFFICULTY_LABELS } from "@/data/match-game";
import type { HistoryEntry } from "@/data/history";

/**
 * The user's played matches, newest first. Only friendly 1v1 rooms exist for
 * now (FINISHED = played to completion; CLOSED/abandoned rooms are not
 * history). Liga / desafío / torneo will feed their own categories once those
 * modes ship. Scores are derived from the claims ledger, like in-game.
 */
export async function getMatchHistory(userId: string): Promise<HistoryEntry[]> {
  const rooms = await prisma.matchRoom.findMany({
    where: { status: "FINISHED", OR: [{ hostId: userId }, { guestId: userId }] },
    orderBy: { finishedAt: "desc" },
    take: 50,
    include: {
      claims: { select: { claimedBy: true } },
      game: { select: { name: true } },
    },
  });
  if (rooms.length === 0) return [];

  const rivalIds = [
    ...new Set(
      rooms
        .map((r) => (r.hostId === userId ? r.guestId : r.hostId))
        .filter((id): id is string => !!id),
    ),
  ];
  const rivalProfiles = await prisma.profile.findMany({ where: { id: { in: rivalIds } } });
  const rivalById = new Map((await toCards(rivalProfiles)).map((c) => [c.id, c]));

  return rooms.map((room) => {
    const rivalId = room.hostId === userId ? room.guestId : room.hostId;
    const rival = rivalId ? rivalById.get(rivalId) : undefined;
    const myScore = room.claims.filter((c) => c.claimedBy === userId).length;
    const rivalScore = room.claims.length - myScore;
    const difficulty = room.difficulty ? DIFFICULTY_LABELS[room.difficulty] ?? room.difficulty : null;

    return {
      id: room.id,
      cat: "amistoso" as const,
      ic: "ic-eleven",
      title: room.game?.name ?? "AMISTOSO",
      sub: `vs ${rival?.president ?? "Rival"}${difficulty ? ` · ${difficulty}` : ""}`,
      score: `${myScore} — ${rivalScore}`,
      result: myScore > rivalScore ? "win" : myScore < rivalScore ? "loss" : "draw",
      finishedAt: room.finishedAt?.getTime() ?? room.updatedAt.getTime(),
    } satisfies HistoryEntry;
  });
}

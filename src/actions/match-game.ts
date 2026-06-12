// "Once Mundialista" core game logic via Prisma. Plain async functions taking
// trusted userIds — NOT a "use server" file. Client-callable wrappers live in
// src/app/actions/match-game.ts ("use server").
//
// Server-authoritative by design: every claim is re-validated here (position,
// nation, timing window, penalty) on the server clock; races are settled by
// the DB unique constraints, and scores are derived (COUNT of claims), so the
// whole game state survives reloads and reconnections.
import { prisma } from "@/lib/prisma";
import { notifyRooms } from "@/lib/realtime-server";
import { BOARD_CELLS } from "@/data/gameboard";
import {
  CLAIM_GRACE_MS,
  COUNTDOWN_MS,
  DEFAULT_TOP,
  DIFFICULTY_TOP,
  GAME_MS,
  PENALTY_MS,
  POS_SUBPOSITIONS,
  isLeadUnreachable,
} from "@/data/match-game";
import type { MatchRoom, Prisma } from "@/generated/prisma/client";

const CELL_BY_ID = new Map(BOARD_CELLS.map((c) => [c.id, c]));
const TOTAL_CELLS = BOARD_CELLS.length;

/** A search hit. Deliberately position/country-free: guessing is the game. */
export interface PlayerHit {
  id: number;
  name: string;
  imageUrl: string | null;
}

export interface NationView {
  id: number;
  name: string;
  flagUrl: string | null;
}

export interface ClaimView {
  cellId: string;
  playerName: string;
  playerImageUrl: string | null;
  mine: boolean;
}

/** Role-relative snapshot. The rival's nation/penalty is NEVER included — it's
 * a knowledge race and each side only sees its own deck position. */
export interface MatchGameState {
  status: "IN_GAME" | "FINISHED" | "CLOSED";
  /** Epoch ms; countdown = [startedAt, startedAt+COUNTDOWN_MS). */
  startedAt: number;
  finishedAt: number | null;
  serverNow: number;
  claims: ClaimView[];
  myScore: number;
  rivalScore: number;
  myNation: NationView;
  myNationIdx: number;
  cycleLength: number;
  myPenaltyUntil: number | null;
  /** Non-null iff FINISHED. */
  result: "win" | "lose" | "draw" | null;
}

export type ClaimErrorCode =
  | "WRONG_POSITION"
  | "WRONG_NATION"
  | "CELL_TAKEN"
  | "PLAYER_USED"
  | "PENALIZED"
  | "TOO_EARLY"
  | "ENDED"
  | "RETRY"
  | "NOT_MEMBER";

export type ClaimResult =
  | {
      ok: true;
      claim: ClaimView;
      myScore: number;
      myNation: NationView;
      myNationIdx: number;
      myPenaltyUntil: number | null;
      serverNow: number;
    }
  | { ok: false; code: ClaimErrorCode; serverNow: number };

export type ChangeNationResult =
  | {
      ok: true;
      myNation: NationView;
      myNationIdx: number;
      myPenaltyUntil: number | null;
      serverNow: number;
    }
  | { ok: false; serverNow: number };

type Role = "host" | "guest";

const roleOf = (room: MatchRoom, userId: string): Role | null =>
  room.hostId === userId ? "host" : room.guestId === userId ? "guest" : null;

const idxOf = (room: MatchRoom, role: Role) =>
  role === "host" ? room.hostNationIdx : room.guestNationIdx;

const penaltyOf = (room: MatchRoom, role: Role) =>
  role === "host" ? room.hostPenaltyUntil : room.guestPenaltyUntil;

/** Playing window (epoch ms) derived from the IN_GAME promotion anchor. */
const gameWindow = (room: MatchRoom) => {
  const started = room.startedAt?.getTime() ?? 0;
  const gameStart = started + COUNTDOWN_MS;
  return { gameStart, gameEnd: gameStart + GAME_MS };
};

async function nationViewOf(room: MatchRoom, idx: number): Promise<NationView> {
  const cycle = room.nationCycle;
  const id = cycle[idx % cycle.length];
  const team = await prisma.nationalTeam.findUnique({
    where: { nationalTeamId: id },
    select: { nationalTeamId: true, name: true, teamImageUrl: true },
  });
  return {
    id,
    name: team?.name ?? "—",
    flagUrl: team?.teamImageUrl ?? null,
  };
}

/** Accent-insensitive substring search, most valuable players first. Global on
 * purpose (no position/country filter — that knowledge is the challenge). */
export async function searchPlayersCore(q: string): Promise<PlayerHit[]> {
  const term = q.trim();
  if (term.length < 3) return [];
  const escaped = term.replace(/[%_\\]/g, "\\$&");
  return prisma.$queryRaw<PlayerHit[]>`
    SELECT "player_id" AS id, "name", "image_url" AS "imageUrl"
    FROM "players"
    WHERE public.f_unaccent("name") ILIKE '%' || public.f_unaccent(${escaped}) || '%'
      AND "sub_position" IS NOT NULL AND "sub_position" <> 'Missing'
    ORDER BY "highest_market_value_in_eur" DESC NULLS LAST, "name" ASC
    LIMIT 8`;
}

/**
 * Promote IN_GAME → FINISHED and apply career stats exactly once. The single
 * status-guarded updateMany is the gate: timer expiry on both clients, the
 * 22nd claim, an early finish and a late reload can all call this — only the
 * first transition runs the stat increments. CLOSED (abandoned) rooms are
 * left untouched.
 */
export async function finalizeCore(roomId: string): Promise<boolean> {
  const now = new Date();
  const finished = await prisma.$transaction(async (tx) => {
    const won = await tx.matchRoom.updateMany({
      where: { id: roomId, status: "IN_GAME" },
      data: { status: "FINISHED", finishedAt: now, updatedAt: now },
    });
    if (won.count === 0) return false;

    const room = await tx.matchRoom.findUnique({ where: { id: roomId } });
    if (!room?.guestId) return true; // unreachable for IN_GAME rooms

    const counts = await tx.matchClaim.groupBy({
      by: ["claimedBy"],
      where: { roomId },
      _count: { _all: true },
    });
    const scoreOf = (id: string) =>
      counts.find((c) => c.claimedBy === id)?._count._all ?? 0;
    const hostScore = scoreOf(room.hostId);
    const guestScore = scoreOf(room.guestId);

    await tx.profile.update({
      where: { id: room.hostId },
      data: {
        played: { increment: 1 },
        ...(hostScore > guestScore ? { wins: { increment: 1 } } : {}),
      },
    });
    await tx.profile.update({
      where: { id: room.guestId },
      data: {
        played: { increment: 1 },
        ...(guestScore > hostScore ? { wins: { increment: 1 } } : {}),
      },
    });
    return true;
  });

  if (finished) await notifyRooms([roomId]);
  return finished;
}

/** Lazy guard for rooms promoted before the deck existed (or a failed fill):
 * writes a fresh shuffled cycle only if it's still empty, then re-reads. */
async function ensureNationCycle(room: MatchRoom): Promise<MatchRoom> {
  if (room.nationCycle.length > 0 || room.status !== "IN_GAME") return room;
  const cycle = await buildNationCycle(room.difficulty);
  await prisma.matchRoom.updateMany({
    where: { id: room.id, nationCycle: { isEmpty: true } },
    data: { nationCycle: cycle, updatedAt: new Date() },
  });
  return (await prisma.matchRoom.findUnique({ where: { id: room.id } })) ?? room;
}

/** Top-N FIFA-ranking national team ids, Fisher–Yates shuffled. Both players
 * walk this exact order, so it's built once per match (at promotion). */
export async function buildNationCycle(difficulty: string | null): Promise<number[]> {
  const top = (difficulty && DIFFICULTY_TOP[difficulty]) || DEFAULT_TOP;
  const teams = await prisma.nationalTeam.findMany({
    where: { fifaRanking: { not: null, lte: top } },
    orderBy: { fifaRanking: "asc" },
    select: { nationalTeamId: true },
  });
  const ids = teams.map((t) => t.nationalTeamId);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/** Role-relative full snapshot. Opportunistically finalizes a room whose
 * clock ran out (a late reload lands straight on the result screen with the
 * stats already applied) and backfills a missing deck. */
export async function getMatchGameStateCore(
  room: MatchRoom,
  userId: string,
): Promise<MatchGameState | null> {
  const role = roleOf(room, userId);
  if (!role || !room.startedAt) return null;
  // Immutable once stamped — survives the re-reads below.
  const startedAt = room.startedAt.getTime();

  if (room.status === "IN_GAME") {
    const { gameEnd } = gameWindow(room);
    if (Date.now() > gameEnd + CLAIM_GRACE_MS) {
      await finalizeCore(room.id);
      room = (await prisma.matchRoom.findUnique({ where: { id: room.id } })) ?? room;
    } else {
      room = await ensureNationCycle(room);
    }
  }

  const status =
    room.status === "IN_GAME" || room.status === "FINISHED" ? room.status : "CLOSED";

  const claims = await prisma.matchClaim.findMany({
    where: { roomId: room.id },
    include: { player: { select: { name: true, imageUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  const myScore = claims.filter((c) => c.claimedBy === userId).length;
  const rivalScore = claims.length - myScore;

  const myIdx = idxOf(room, role);
  const myNation =
    room.nationCycle.length > 0
      ? await nationViewOf(room, myIdx)
      : { id: 0, name: "—", flagUrl: null };

  let result: MatchGameState["result"] = null;
  if (status === "FINISHED") {
    result = myScore > rivalScore ? "win" : myScore < rivalScore ? "lose" : "draw";
  }

  return {
    status,
    startedAt,
    finishedAt: room.finishedAt?.getTime() ?? null,
    serverNow: Date.now(),
    claims: claims.map((c) => ({
      cellId: c.cellId,
      playerName: c.player.name,
      playerImageUrl: c.player.imageUrl,
      mine: c.claimedBy === userId,
    })),
    myScore,
    rivalScore,
    myNation,
    myNationIdx: myIdx,
    cycleLength: room.nationCycle.length,
    myPenaltyUntil: penaltyOf(room, role)?.getTime() ?? null,
    result,
  };
}

/**
 * Attempt to claim `cellId` with `playerId`. Validates everything on the
 * server clock, then commits claim + nation advance atomically; the loser of
 * a cell race rolls back untouched (no advance, no penalty — invalid attempts
 * are free by design).
 */
export async function claimCellCore(
  room: MatchRoom,
  userId: string,
  cellId: string,
  playerId: number,
): Promise<ClaimResult> {
  const fail = (code: ClaimErrorCode): ClaimResult => ({
    ok: false,
    code,
    serverNow: Date.now(),
  });

  const role = roleOf(room, userId);
  if (!role) return fail("NOT_MEMBER");
  if (room.status !== "IN_GAME" || !room.startedAt) return fail("ENDED");

  const now = Date.now();
  const { gameStart, gameEnd } = gameWindow(room);
  if (now < gameStart) return fail("TOO_EARLY");
  if (now > gameEnd + CLAIM_GRACE_MS) {
    await finalizeCore(room.id);
    return fail("ENDED");
  }

  const penalty = penaltyOf(room, role);
  if (penalty && penalty.getTime() > now) return fail("PENALIZED");

  const cell = CELL_BY_ID.get(cellId);
  if (!cell) return fail("WRONG_POSITION");
  const allowed = POS_SUBPOSITIONS[cell.pos] ?? [];

  room = await ensureNationCycle(room);
  if (room.nationCycle.length === 0) return fail("RETRY");

  const myIdx = idxOf(room, role);
  const nationId = room.nationCycle[myIdx % room.nationCycle.length];

  const [player, nation] = await Promise.all([
    prisma.futPlayer.findUnique({
      where: { playerId },
      select: { subPosition: true, countryOfCitizenship: true, name: true, imageUrl: true },
    }),
    prisma.nationalTeam.findUnique({
      where: { nationalTeamId: nationId },
      select: { countryName: true },
    }),
  ]);
  if (!player?.subPosition || !allowed.includes(player.subPosition)) {
    return fail("WRONG_POSITION");
  }
  if (!nation?.countryName || player.countryOfCitizenship !== nation.countryName) {
    return fail("WRONG_NATION");
  }

  const nowDate = new Date();
  const idxField = role === "host" ? "hostNationIdx" : "guestNationIdx";
  const penaltyGuard: Prisma.MatchRoomWhereInput =
    role === "host"
      ? { OR: [{ hostPenaltyUntil: null }, { hostPenaltyUntil: { lte: nowDate } }] }
      : { OR: [{ guestPenaltyUntil: null }, { guestPenaltyUntil: { lte: nowDate } }] };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.matchClaim.create({
        data: { roomId: room.id, cellId, playerId, claimedBy: userId },
      });
      // Optimistic guard: my idx unchanged and no penalty raced in between —
      // otherwise roll the claim back too (count 0 → STALE).
      const adv = await tx.matchRoom.updateMany({
        where: {
          id: room.id,
          status: "IN_GAME",
          [idxField]: myIdx,
          AND: [penaltyGuard],
        },
        data: { [idxField]: { increment: 1 }, updatedAt: nowDate },
      });
      if (adv.count === 0) throw new Error("STALE");
    });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      // Prisma 7 driver adapters bury the violated fields inside
      // meta.driverAdapterError.cause.constraint.fields — stringify the whole
      // meta (plus message) instead of poking that fragile path.
      const detail =
        JSON.stringify((e as { meta?: unknown }).meta ?? "") +
        (e instanceof Error ? e.message : "");
      return fail(detail.includes("player_id") ? "PLAYER_USED" : "CELL_TAKEN");
    }
    if (e instanceof Error && e.message === "STALE") return fail("RETRY");
    throw e;
  }

  // Board full → the match is over for both. Then ping the rival either way.
  const totalClaims = await prisma.matchClaim.count({ where: { roomId: room.id } });
  if (totalClaims >= TOTAL_CELLS) await finalizeCore(room.id);
  await notifyRooms([room.id]);

  const myNation = await nationViewOf(room, myIdx + 1);
  const myScore = await prisma.matchClaim.count({
    where: { roomId: room.id, claimedBy: userId },
  });
  return {
    ok: true,
    claim: {
      cellId,
      playerName: player.name,
      playerImageUrl: player.imageUrl,
      mine: true,
    },
    myScore,
    myNation,
    myNationIdx: myIdx + 1,
    myPenaltyUntil: null,
    serverNow: Date.now(),
  };
}

/**
 * Voluntary nation change: starts the 5s penalty and advances my deck index
 * immediately (the client hides the new nation until the penalty ends).
 * Idempotent under double-fire: losing the optimistic guard returns the
 * already-running penalty so the client just resumes its countdown.
 */
export async function changeNationCore(
  room: MatchRoom,
  userId: string,
): Promise<ChangeNationResult> {
  const role = roleOf(room, userId);
  if (!role || room.status !== "IN_GAME" || !room.startedAt) {
    return { ok: false, serverNow: Date.now() };
  }
  const now = Date.now();
  const { gameStart, gameEnd } = gameWindow(room);
  if (now < gameStart || now > gameEnd) return { ok: false, serverNow: Date.now() };

  room = await ensureNationCycle(room);
  if (room.nationCycle.length === 0) return { ok: false, serverNow: Date.now() };

  const myIdx = idxOf(room, role);
  const nowDate = new Date();
  const until = new Date(now + PENALTY_MS);
  const idxField = role === "host" ? "hostNationIdx" : "guestNationIdx";
  const penaltyField = role === "host" ? "hostPenaltyUntil" : "guestPenaltyUntil";
  const penaltyGuard: Prisma.MatchRoomWhereInput =
    role === "host"
      ? { OR: [{ hostPenaltyUntil: null }, { hostPenaltyUntil: { lte: nowDate } }] }
      : { OR: [{ guestPenaltyUntil: null }, { guestPenaltyUntil: { lte: nowDate } }] };

  const changed = await prisma.matchRoom.updateMany({
    where: { id: room.id, status: "IN_GAME", [idxField]: myIdx, AND: [penaltyGuard] },
    data: { [penaltyField]: until, [idxField]: { increment: 1 }, updatedAt: nowDate },
  });

  if (changed.count > 0) {
    const myNation = await nationViewOf(room, myIdx + 1);
    return {
      ok: true,
      myNation,
      myNationIdx: myIdx + 1,
      myPenaltyUntil: until.getTime(),
      serverNow: Date.now(),
    };
  }

  // Double-fire / raced with a claim: hand back whatever is current now.
  const fresh = await prisma.matchRoom.findUnique({ where: { id: room.id } });
  if (!fresh) return { ok: false, serverNow: Date.now() };
  const freshIdx = idxOf(fresh, role);
  const myNation = await nationViewOf(fresh, freshIdx);
  return {
    ok: true,
    myNation,
    myNationIdx: freshIdx,
    myPenaltyUntil: penaltyOf(fresh, role)?.getTime() ?? null,
    serverNow: Date.now(),
  };
}

/** Early finish: either member may end the match once the lead is provably
 * unreachable. Re-validated server-side before finalizing. */
export async function finishEarlyCore(room: MatchRoom, userId: string): Promise<boolean> {
  const role = roleOf(room, userId);
  if (!role || room.status !== "IN_GAME" || !room.guestId) return false;

  const counts = await prisma.matchClaim.groupBy({
    by: ["claimedBy"],
    where: { roomId: room.id },
    _count: { _all: true },
  });
  const scoreOf = (id: string) => counts.find((c) => c.claimedBy === id)?._count._all ?? 0;
  const hostScore = scoreOf(room.hostId);
  const guestScore = scoreOf(room.guestId);
  const free = TOTAL_CELLS - hostScore - guestScore;
  const leader = Math.max(hostScore, guestScore);
  const other = Math.min(hostScore, guestScore);

  if (!isLeadUnreachable(leader, other, free)) return false;
  return finalizeCore(room.id);
}

/** Timer-driven finish: valid once the clock ran out (small tolerance for
 * residual skew) or the board is full. Both clients call it; idempotent. */
export async function finalizeIfDueCore(room: MatchRoom): Promise<boolean> {
  if (room.status !== "IN_GAME" || !room.startedAt) return false;
  const { gameEnd } = gameWindow(room);
  if (Date.now() >= gameEnd - 1_000) return finalizeCore(room.id);
  const claims = await prisma.matchClaim.count({ where: { roomId: room.id } });
  if (claims >= TOTAL_CELLS) return finalizeCore(room.id);
  return false;
}

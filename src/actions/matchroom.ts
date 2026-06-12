// Match-room reads + core room logic via Prisma. Plain async functions for
// Server Components — auth comes from Supabase cookies upstream. NOT a
// "use server" file: nothing here is a public endpoint, so `claimGuestSeat`
// can safely take a trusted userId. Client-callable wrappers live in
// src/app/actions/matchroom.ts ("use server").
import { prisma } from "@/lib/prisma";
import { notifyInvites, notifyRooms } from "@/lib/realtime-server";
import { buildNationCycle } from "@/actions/match-game";
import {
  getFriends,
  getMatchCard,
  type PlayerCard,
  type SelfMatchCard,
} from "@/actions/friends";
import type { MatchRoom, MatchRoomStatus, Prisma } from "@/generated/prisma/client";

export type RoomRole = "host" | "guest";

/** The serializable slice of a room the lobby needs. */
export interface RoomSnapshot {
  id: string;
  code: string;
  status: MatchRoomStatus;
  difficulty: string | null;
  gameName: string | null;
  hostId: string;
  guestId: string | null;
  /** Server timestamp (epoch ms) anchoring the match-entry timeline. */
  readyAt: number | null;
  /** Server timestamp (epoch ms) of the READY → IN_GAME promotion. */
  startedAt: number | null;
}

/** Everything the lobby screen needs for one of the two members. */
export interface RoomLobbyData {
  room: RoomSnapshot;
  role: RoomRole;
  me: SelfMatchCard;
  rival: SelfMatchCard | null;
  /** Host only: friends list for the invite panel. */
  friends: PlayerCard[];
  /** Host only: friend ids with a PENDING invite to this room. */
  invitedIds: string[];
  /** Server clock at render time — clients derive their clock skew from it. */
  serverNow: number;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function getRoomByCode(code: string): Promise<MatchRoom | null> {
  return prisma.matchRoom.findUnique({ where: { code } });
}

/** Pending-invite receivers + room ids of every active room the user hosts,
 * and the rooms where they sit as guest. Used to notify everyone affected
 * before the user abandons/closes their current rooms. */
export async function activeRoomFootprint(userId: string) {
  const [hostedInvites, hostedRooms, guestRooms] = await Promise.all([
    prisma.matchInvite.findMany({
      where: { status: "PENDING", room: { hostId: userId, status: { in: ["OPEN", "READY"] } } },
      select: { receiverId: true, roomId: true },
    }),
    prisma.matchRoom.findMany({
      where: { hostId: userId, status: { in: ["OPEN", "READY", "IN_GAME"] } },
      select: { id: true },
    }),
    prisma.matchRoom.findMany({
      where: { guestId: userId, status: { in: ["READY", "IN_GAME"] } },
      select: { id: true },
    }),
  ]);
  return {
    roomIds: [...hostedRooms.map((r) => r.id), ...guestRooms.map((r) => r.id)],
    receiverIds: hostedInvites.map((i) => i.receiverId),
  };
}

/** Close every active room the user hosts (cancelling its pending invites) and
 * vacate any guest seat they occupy. Keeps each player in at most one room. */
export async function leaveActiveRooms(tx: Prisma.TransactionClient, userId: string) {
  const now = new Date();
  await tx.matchInvite.updateMany({
    where: { status: "PENDING", room: { hostId: userId, status: { in: ["OPEN", "READY"] } } },
    data: { status: "CANCELLED", respondedAt: now },
  });
  await tx.matchRoom.updateMany({
    where: { hostId: userId, status: { in: ["OPEN", "READY", "IN_GAME"] } },
    data: { status: "CLOSED", updatedAt: now },
  });
  // A guest leaving a pre-kickoff lobby frees the seat (the host keeps the
  // room); leaving a match already in play abandons it for both.
  await tx.matchRoom.updateMany({
    where: { guestId: userId, status: "READY" },
    data: { guestId: null, status: "OPEN", readyAt: null, updatedAt: now },
  });
  await tx.matchRoom.updateMany({
    where: { guestId: userId, status: "IN_GAME" },
    data: { status: "CLOSED", updatedAt: now },
  });
}

/**
 * Claim the guest seat of an open room for `userId` (a TRUSTED id resolved
 * server-side — this module is not a public action endpoint). Atomic: the
 * first player to run this wins the seat; everyone else gets an error.
 * Resolves the room's pending invites (mine → ACCEPTED, others → EXPIRED),
 * closes any room the joiner was hosting, and pings every affected client
 * over Realtime Broadcast. Used by the room page to auto-join a visitor who
 * opens an invite link, and by the invite-accept action.
 */
export async function claimGuestSeat(code: string, userId: string): Promise<ActionResult> {
  const room = await prisma.matchRoom.findUnique({ where: { code } });
  if (!room || room.status === "CLOSED") {
    return { ok: false, error: "Esta sala ya no está disponible." };
  }
  if (room.hostId === userId || room.guestId === userId) return { ok: true }; // already in

  // Who must hear about this change (fetched up-front; cheap selects).
  const [roomInvites, footprint] = await Promise.all([
    prisma.matchInvite.findMany({
      where: { roomId: room.id, status: "PENDING" },
      select: { receiverId: true },
    }),
    activeRoomFootprint(userId),
  ]);

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      // Leave my previous rooms FIRST. Order matters: this also vacates any
      // guest seat I hold, so running it after the claim below would undo the
      // claim itself (the room would silently flip back to OPEN with no
      // guest). Before the claim I hold no seat in the target room, so it
      // can't be touched. If the claim then fails, the whole tx rolls back
      // and my previous room survives untouched.
      await leaveActiveRooms(tx, userId);

      // Atomic seat claim: only succeeds while the seat is still free. The
      // timeline anchors reset so a re-claimed room starts a fresh sequence.
      const claimed = await tx.matchRoom.updateMany({
        where: { id: room.id, status: "OPEN", guestId: null },
        data: { guestId: userId, status: "READY", readyAt: null, startedAt: null, updatedAt: now },
      });
      if (claimed.count === 0) throw new Error("SEAT_TAKEN");

      // Resolve this room's invites: mine accepted, the rest expired.
      await tx.matchInvite.updateMany({
        where: { roomId: room.id, receiverId: userId, status: "PENDING" },
        data: { status: "ACCEPTED", respondedAt: now },
      });
      await tx.matchInvite.updateMany({
        where: { roomId: room.id, status: "PENDING" },
        data: { status: "EXPIRED", respondedAt: now },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SEAT_TAKEN") {
      return { ok: false, error: "Otro presidente tomó el lugar. Sala completa." };
    }
    throw e;
  }

  await Promise.all([
    notifyRooms([room.id, ...footprint.roomIds]),
    notifyInvites([
      userId,
      room.hostId,
      ...roomInvites.map((i) => i.receiverId),
      ...footprint.receiverIds,
    ]),
  ]);
  return { ok: true };
}

async function gameNameOf(room: MatchRoom): Promise<string | null> {
  if (room.gameId == null) return null;
  const game = await prisma.game.findUnique({
    where: { id: room.gameId },
    select: { name: true },
  });
  return game?.name ?? null;
}

const toSnapshot = (room: MatchRoom, gameName: string | null): RoomSnapshot => ({
  id: room.id,
  code: room.code,
  status: room.status,
  difficulty: room.difficulty,
  gameName,
  hostId: room.hostId,
  guestId: room.guestId,
  readyAt: room.readyAt?.getTime() ?? null,
  startedAt: room.startedAt?.getTime() ?? null,
});

/**
 * Promote a READY room (whose entry cinematic is underway — readyAt stamped)
 * to IN_GAME. Idempotent: the first player landing in the game room wins the
 * write, later calls are no-ops. The winning promotion also seeds the match's
 * shuffled nation cycle (difficulty-sized FIFA top), so both players walk one
 * identical deck — the loser's shuffle is discarded with its no-op update.
 * Pings the room topic so the rival's client learns the match is officially on.
 */
export async function markRoomInGame(room: MatchRoom): Promise<void> {
  const nationCycle = await buildNationCycle(room.difficulty);
  const now = new Date();
  const promoted = await prisma.matchRoom.updateMany({
    where: { id: room.id, status: "READY", readyAt: { not: null } },
    data: { status: "IN_GAME", startedAt: now, nationCycle, updatedAt: now },
  });
  if (promoted.count > 0) await notifyRooms([room.id]);
}

/** Lobby data for a room member (host or guest); null if `userId` is neither. */
export async function getRoomLobbyData(
  room: MatchRoom,
  userId: string,
): Promise<RoomLobbyData | null> {
  const role: RoomRole | null =
    room.hostId === userId ? "host" : room.guestId === userId ? "guest" : null;
  if (!role) return null;

  const rivalId = role === "host" ? room.guestId : room.hostId;

  const [me, rival, gameName, friends, pendingInvites] = await Promise.all([
    getMatchCard(userId),
    rivalId ? getMatchCard(rivalId) : Promise.resolve(null),
    gameNameOf(room),
    role === "host" ? getFriends(userId) : Promise.resolve([]),
    role === "host"
      ? prisma.matchInvite.findMany({
          where: { roomId: room.id, status: "PENDING" },
          select: { receiverId: true },
        })
      : Promise.resolve([]),
  ]);
  if (!me) return null;

  return {
    room: toSnapshot(room, gameName),
    role,
    me,
    rival,
    friends,
    invitedIds: pendingInvites.map((i) => i.receiverId),
    serverNow: Date.now(),
  };
}

/** Everything the in-game arena needs for one of the two members. */
export interface ArenaData {
  room: RoomSnapshot;
  role: RoomRole;
  me: SelfMatchCard;
  rival: SelfMatchCard;
  serverNow: number;
}

/** Arena data for a room member; null if `userId` is neither seat or a card
 * is missing. Leaner than getRoomLobbyData (no friends/invites). */
export async function getArenaData(room: MatchRoom, userId: string): Promise<ArenaData | null> {
  const role: RoomRole | null =
    room.hostId === userId ? "host" : room.guestId === userId ? "guest" : null;
  if (!role || !room.guestId) return null;

  const rivalId = role === "host" ? room.guestId : room.hostId;
  const [me, rival, gameName] = await Promise.all([
    getMatchCard(userId),
    getMatchCard(rivalId),
    gameNameOf(room),
  ]);
  if (!me || !rival) return null;

  return { room: toSnapshot(room, gameName), role, me, rival, serverNow: Date.now() };
}


// Match-room reads via Prisma. Plain async functions for Server Components —
// auth comes from Supabase cookies upstream. Mutations live in
// src/app/actions/matchroom.ts ("use server").
import { prisma } from "@/lib/prisma";
import {
  getFriends,
  getMatchCard,
  type PlayerCard,
  type SelfMatchCard,
} from "@/actions/friends";
import type { MatchRoom, MatchRoomStatus } from "@/generated/prisma/client";

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
}

/** What a non-member sees when opening an invite link to an open room. */
export interface RoomJoinData {
  code: string;
  gameName: string | null;
  difficulty: string | null;
  host: SelfMatchCard;
}

export async function getRoomByCode(code: string): Promise<MatchRoom | null> {
  return prisma.matchRoom.findUnique({ where: { code } });
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
});

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
  };
}

/** Join-screen data for a visitor while the guest seat is free. */
export async function getRoomJoinData(room: MatchRoom): Promise<RoomJoinData | null> {
  const [host, gameName] = await Promise.all([
    getMatchCard(room.hostId),
    gameNameOf(room),
  ]);
  if (!host) return null;
  return { code: room.code, gameName, difficulty: room.difficulty, host };
}

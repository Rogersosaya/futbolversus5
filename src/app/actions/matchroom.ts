"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createSSRClient } from "@/lib/supabase-server";
import { toCards, getMatchCard, type PlayerCard, type SelfMatchCard } from "@/actions/friends";
import type { Prisma } from "@/generated/prisma/client";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** One floating invite notification (either direction). */
export interface MatchInviteToast {
  inviteId: string;
  roomCode: string;
  /** "in" = I received it, "out" = I sent it. */
  direction: "in" | "out";
  /** The OTHER player (sender for incoming, receiver for outgoing). */
  player: PlayerCard;
  gameName: string | null;
}

// Unambiguous alphabet (no I/O/0/1) for short shareable room codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

async function requireUser(): Promise<string | null> {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Close every active room the user hosts (cancelling its pending invites) and
 * vacate any guest seat they occupy. Keeps each player in at most one room. */
async function leaveActiveRooms(tx: Prisma.TransactionClient, userId: string) {
  const now = new Date();
  await tx.matchInvite.updateMany({
    where: { status: "PENDING", room: { hostId: userId, status: { in: ["OPEN", "READY"] } } },
    data: { status: "CANCELLED", respondedAt: now },
  });
  await tx.matchRoom.updateMany({
    where: { hostId: userId, status: { in: ["OPEN", "READY"] } },
    data: { status: "CLOSED", updatedAt: now },
  });
  await tx.matchRoom.updateMany({
    where: { guestId: userId, status: "READY" },
    data: { guestId: null, status: "OPEN", updatedAt: now },
  });
}

/**
 * Create a persistent friendly-match room (host seat = current user) and go to
 * its lobby at /jugar/amistoso/<code>. Any previous active room of the user is
 * closed first, so JUGAR always lands in a fresh lobby.
 */
export async function createFriendlyRoom(
  gameId: number | null,
  difficulty: string | null,
): Promise<void> {
  const userId = await requireUser();
  if (!userId) redirect("/login");

  await prisma.$transaction(async (tx) => {
    await leaveActiveRooms(tx, userId);
  });

  // Retry on the (unlikely) code collision instead of failing the click.
  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await prisma.matchRoom.create({
        data: { code, hostId: userId, gameId, difficulty },
      });
      break;
    } catch (e) {
      if (attempt === 4) throw e;
      code = generateRoomCode();
    }
  }

  redirect(`/jugar/amistoso/${code}`);
}

/**
 * Claim the guest seat of an open room — the invite-link flow. Atomic: the
 * first player to run this wins the seat; everyone else gets an error. Also
 * resolves the room's pending invites (mine → ACCEPTED, others → EXPIRED).
 */
export async function joinRoomByCode(code: string): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };

  const room = await prisma.matchRoom.findUnique({ where: { code } });
  if (!room || room.status === "CLOSED") {
    return { ok: false, error: "Esta sala ya no está disponible." };
  }
  if (room.hostId === userId || room.guestId === userId) return { ok: true }; // already in

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      // Atomic seat claim: only succeeds while the seat is still free.
      const claimed = await tx.matchRoom.updateMany({
        where: { id: room.id, status: "OPEN", guestId: null },
        data: { guestId: userId, status: "READY", updatedAt: now },
      });
      if (claimed.count === 0) throw new Error("SEAT_TAKEN");

      // Leaving any open room I was hosting (its invites die with it).
      await tx.matchInvite.updateMany({
        where: { status: "PENDING", room: { hostId: userId, status: "OPEN" } },
        data: { status: "CANCELLED", respondedAt: now },
      });
      await tx.matchRoom.updateMany({
        where: { hostId: userId, status: "OPEN" },
        data: { status: "CLOSED", updatedAt: now },
      });

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

  revalidatePath(`/jugar/amistoso/${code}`);
  return { ok: true };
}

/**
 * Leave the room: the host closes it (lobby dissolves for both), the guest
 * frees the seat (room reopens for the host).
 */
export async function leaveRoom(code: string): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };

  const room = await prisma.matchRoom.findUnique({ where: { code } });
  if (!room || room.status === "CLOSED") return { ok: true };

  const now = new Date();
  if (room.hostId === userId) {
    await prisma.$transaction([
      prisma.matchInvite.updateMany({
        where: { roomId: room.id, status: "PENDING" },
        data: { status: "CANCELLED", respondedAt: now },
      }),
      prisma.matchRoom.update({
        where: { id: room.id },
        data: { status: "CLOSED", updatedAt: now },
      }),
    ]);
  } else if (room.guestId === userId) {
    await prisma.matchRoom.update({
      where: { id: room.id },
      data: { guestId: null, status: "OPEN", updatedAt: now },
    });
  }

  revalidatePath(`/jugar/amistoso/${code}`);
  return { ok: true };
}

/**
 * Invite a friend to the room. Host-only, seat must be free, and the receiver
 * must be an accepted friend. Re-inviting revives a declined/expired invite.
 */
export async function sendMatchInvite(
  code: string,
  receiverId: string,
): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };

  const room = await prisma.matchRoom.findUnique({ where: { code } });
  if (!room || room.hostId !== userId) return { ok: false, error: "Sala no encontrada" };
  if (room.status !== "OPEN" || room.guestId) {
    return { ok: false, error: "La sala ya está completa" };
  }

  const [a, b] = userId < receiverId ? [userId, receiverId] : [receiverId, userId];
  const friendship = await prisma.friendship.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  });
  if (!friendship) return { ok: false, error: "Solo puedes invitar a tus amigos" };

  await prisma.matchInvite.upsert({
    where: { roomId_receiverId: { roomId: room.id, receiverId } },
    create: { roomId: room.id, senderId: userId, receiverId },
    update: { status: "PENDING", respondedAt: null, createdAt: new Date() },
  });
  return { ok: true };
}

/** Sender cancels a pending invite — the floating card vanishes on both ends. */
export async function cancelMatchInvite(inviteId: string): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };

  const invite = await prisma.matchInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.senderId !== userId) return { ok: false, error: "Invitación no encontrada" };
  if (invite.status === "PENDING") {
    await prisma.matchInvite.update({
      where: { id: inviteId },
      data: { status: "CANCELLED", respondedAt: new Date() },
    });
  }
  return { ok: true };
}

/**
 * Receiver accepts (joins the sender's lobby) or declines a pending invite.
 * On accept the seat is claimed atomically — if someone got there first the
 * invite expires and the caller is told the room is full.
 */
export async function respondMatchInvite(
  inviteId: string,
  accept: boolean,
): Promise<ActionResult & { code?: string }> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };

  const invite = await prisma.matchInvite.findUnique({
    where: { id: inviteId },
    include: { room: { select: { code: true } } },
  });
  if (!invite || invite.receiverId !== userId) {
    return { ok: false, error: "Invitación no encontrada" };
  }
  if (invite.status !== "PENDING") {
    return { ok: false, error: "La invitación ya no está disponible" };
  }

  if (!accept) {
    await prisma.matchInvite.update({
      where: { id: inviteId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
    return { ok: true };
  }

  const joined = await joinRoomByCode(invite.room.code);
  if (!joined.ok) {
    // Seat was taken meanwhile — make sure this card disappears for both.
    await prisma.matchInvite.updateMany({
      where: { id: inviteId, status: "PENDING" },
      data: { status: "EXPIRED", respondedAt: new Date() },
    });
    return joined;
  }
  return { ok: true, code: invite.room.code };
}

/** Both directions of pending invites, enriched for the floating cards. Only
 * invites whose room still has a free seat are alive. */
export async function myMatchInviteToasts(): Promise<MatchInviteToast[]> {
  const userId = await requireUser();
  if (!userId) return [];

  const invites = await prisma.matchInvite.findMany({
    where: {
      status: "PENDING",
      room: { status: "OPEN" },
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: { room: { select: { code: true, gameId: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (invites.length === 0) return [];

  const otherIds = invites.map((i) => (i.senderId === userId ? i.receiverId : i.senderId));
  const gameIds = [...new Set(invites.map((i) => i.room.gameId).filter((g): g is number => g != null))];
  const [profiles, games] = await Promise.all([
    prisma.profile.findMany({ where: { id: { in: otherIds } } }),
    gameIds.length
      ? prisma.game.findMany({ where: { id: { in: gameIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);
  const cards = await toCards(profiles);
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const gameById = new Map(games.map((g) => [g.id, g.name]));

  return invites
    .map((i) => {
      const direction: "in" | "out" = i.receiverId === userId ? "in" : "out";
      const player = cardById.get(direction === "in" ? i.senderId : i.receiverId);
      if (!player) return null;
      return {
        inviteId: i.id,
        roomCode: i.room.code,
        direction,
        player,
        gameName: i.room.gameId != null ? gameById.get(i.room.gameId) ?? null : null,
      };
    })
    .filter((t): t is MatchInviteToast => !!t);
}

/** Client-callable live snapshot of the room for the lobby's realtime refresh:
 * current status + the rival's card (if seated) + pending invite targets. */
export async function getRoomPeers(code: string): Promise<{
  status: "OPEN" | "READY" | "CLOSED";
  rival: SelfMatchCard | null;
  invitedIds: string[];
} | null> {
  const userId = await requireUser();
  if (!userId) return null;

  const room = await prisma.matchRoom.findUnique({ where: { code } });
  if (!room || (room.hostId !== userId && room.guestId !== userId)) return null;

  const rivalId = room.hostId === userId ? room.guestId : room.hostId;
  const [rival, pending] = await Promise.all([
    rivalId ? getMatchCard(rivalId) : Promise.resolve(null),
    room.hostId === userId
      ? prisma.matchInvite.findMany({
          where: { roomId: room.id, status: "PENDING" },
          select: { receiverId: true },
        })
      : Promise.resolve([]),
  ]);

  return { status: room.status, rival, invitedIds: pending.map((p) => p.receiverId) };
}

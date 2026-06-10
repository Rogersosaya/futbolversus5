"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createSSRClient } from "@/lib/supabase-server";
import { countryByCode } from "@/data/game-assets";
import { getCollectiblesByIds } from "@/actions/catalog";
import {
  getIncomingRequests,
  getFriendsOverview,
  type PlayerCard,
  type RequestCard,
} from "@/actions/friends";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Canonical (a, b) ordering for a friendship row: a < b. */
function pair(x: string, y: string): { userAId: string; userBId: string } {
  return x < y ? { userAId: x, userBId: y } : { userAId: y, userBId: x };
}

function refresh() {
  revalidatePath("/club");
  revalidatePath("/jugar/amistoso");
}

async function requireUser() {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Client-callable re-fetch of the user's pending incoming requests. Used by
 * the realtime hook to enrich raw change events into full request cards. */
export async function myIncomingRequests(): Promise<RequestCard[]> {
  const userId = await requireUser();
  if (!userId) return [];
  return getIncomingRequests(userId);
}

/** Client-callable re-fetch of the whole friends overview (friends + pending
 * requests both ways), for live-refreshing the Mi Club section. */
export async function myFriendsOverview() {
  const userId = await requireUser();
  if (!userId) return { friends: [], incoming: [], outgoing: [] };
  return getFriendsOverview(userId);
}

/**
 * Search players by president name to add as friends. Only profiles that
 * finished setup (have a president name) are real players. Excludes the user,
 * existing friends, and players with a pending request in either direction.
 */
export async function searchPlayers(query: string): Promise<PlayerCard[]> {
  const userId = await requireUser();
  if (!userId) return [];
  const q = query.trim();
  if (q.length < 2) return [];

  const [matches, friendships, requests] = await Promise.all([
    prisma.profile.findMany({
      where: {
        presidentName: { not: null, contains: q, mode: "insensitive" },
        id: { not: userId },
      },
      orderBy: { presidentName: "asc" },
      take: 20,
    }),
    prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    }),
    prisma.friendRequest.findMany({
      where: {
        status: "PENDING",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    }),
  ]);

  // Build the exclusion set: already friends, or a pending request either way.
  const excluded = new Set<string>([userId]);
  for (const f of friendships) excluded.add(f.userAId === userId ? f.userBId : f.userAId);
  for (const r of requests) excluded.add(r.senderId === userId ? r.receiverId : r.senderId);

  const visible = matches.filter((p) => !excluded.has(p.id)).slice(0, 10);
  if (visible.length === 0) return [];

  const shieldIds = visible.map((p) => p.shieldId).filter((v): v is string => !!v);
  const crests = await getCollectiblesByIds(shieldIds);
  const crestById = new Map(crests.map((c) => [c.id, c]));

  return visible.map((p) => {
    const crest = p.shieldId ? crestById.get(p.shieldId) : undefined;
    return {
      id: p.id,
      president: p.presidentName ?? "Presidente",
      club: crest?.name ?? "Club sin escudo",
      country: p.country ?? "",
      countryName: countryByCode(p.country ?? "")?.name ?? "",
      art: crest
        ? {
            kind: crest.kind,
            artKey: crest.artKey,
            imageUrl: crest.imageUrl,
            gradientFrom: crest.gradientFrom,
            gradientTo: crest.gradientTo,
          }
        : null,
      level: p.level,
      power: p.power,
      winPct: p.played > 0 ? Math.round((p.wins / p.played) * 100) : 0,
    };
  });
}

/**
 * Send a friend request. If the receiver already sent the user a pending
 * request, this auto-accepts it (creates the friendship). Otherwise creates a
 * PENDING request (or revives a previously declined/cancelled one).
 */
export async function sendFriendRequest(receiverId: string): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };
  if (receiverId === userId) return { ok: false, error: "No puedes agregarte a ti mismo" };

  const receiver = await prisma.profile.findUnique({ where: { id: receiverId } });
  if (!receiver || !receiver.presidentName) {
    return { ok: false, error: "Jugador no disponible" };
  }

  const link = pair(userId, receiverId);
  const existingFriend = await prisma.friendship.findUnique({
    where: { userAId_userBId: link },
  });
  if (existingFriend) return { ok: false, error: "Ya son amigos" };

  // Did the receiver already send ME a pending request? Then accept it.
  const reverse = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: receiverId, receiverId: userId } },
  });
  if (reverse && reverse.status === "PENDING") {
    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: reverse.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      prisma.friendship.create({ data: link }),
    ]);
    refresh();
    return { ok: true };
  }

  // Upsert my outgoing request (revive a declined/cancelled one).
  await prisma.friendRequest.upsert({
    where: { senderId_receiverId: { senderId: userId, receiverId } },
    create: { senderId: userId, receiverId, status: "PENDING" },
    update: { status: "PENDING", respondedAt: null, createdAt: new Date() },
  });
  refresh();
  return { ok: true };
}

/** Accept or decline a pending request addressed to the current user. */
export async function respondFriendRequest(
  requestId: string,
  accept: boolean,
): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };

  const req = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!req || req.receiverId !== userId) return { ok: false, error: "Solicitud no encontrada" };
  if (req.status !== "PENDING") return { ok: true }; // already resolved → no-op

  if (accept) {
    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      prisma.friendship.create({ data: pair(req.senderId, req.receiverId) }),
    ]);
  } else {
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
  }
  refresh();
  return { ok: true };
}

/** Cancel a pending request the current user sent. */
export async function cancelFriendRequest(requestId: string): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };

  const req = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!req || req.senderId !== userId) return { ok: false, error: "Solicitud no encontrada" };
  if (req.status === "PENDING") {
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED", respondedAt: new Date() },
    });
  }
  refresh();
  return { ok: true };
}

/** Remove an existing friend (deletes the friendship + any resolved requests). */
export async function removeFriend(friendId: string): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "No autenticado" };

  const link = pair(userId, friendId);
  await prisma.friendship.deleteMany({ where: link });
  // Clear request history both ways so they can re-add later.
  await prisma.friendRequest.deleteMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
  });
  refresh();
  return { ok: true };
}

// Friends/social reads via Prisma. Plain async functions for Server Components
// (auth comes from Supabase cookies upstream). The card shape mirrors the
// transfer ranking pattern: a profile resolved to club name + crest art.
import { prisma } from "@/lib/prisma";
import { getCollectiblesByIds } from "@/actions/catalog";
import { countryByCode } from "@/data/game-assets";
import type { CollectibleArtData } from "@/components/CollectibleArt";
import type { Profile } from "@/generated/prisma/client";

/** A player rendered as a card (friend, request, search result). */
export interface PlayerCard {
  id: string;
  president: string;
  club: string;
  /** 2-letter country code, e.g. "pe". */
  country: string;
  countryName: string;
  art: CollectibleArtData | null;
  level: number;
  power: number;
  /** Win percentage (0–100), derived from wins/played. */
  winPct: number;
}

/** A pending friend request paired with the other player's card. */
export interface RequestCard {
  requestId: string;
  player: PlayerCard;
}

const winPctOf = (wins: number, played: number) =>
  played > 0 ? Math.round((wins / played) * 100) : 0;

/** Resolve a batch of profiles to player cards, sharing one crest lookup. */
export async function toCards(profiles: Profile[]): Promise<PlayerCard[]> {
  const shieldIds = profiles.map((p) => p.shieldId).filter((v): v is string => !!v);
  const crests = await getCollectiblesByIds(shieldIds);
  const crestById = new Map(crests.map((c) => [c.id, c]));

  return profiles.map((p) => {
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
      winPct: winPctOf(p.wins, p.played),
    };
  });
}

/** Indexed cards in the same order as the input profile list. */
async function cardsById(profiles: Profile[]): Promise<Map<string, PlayerCard>> {
  const cards = await toCards(profiles);
  return new Map(cards.map((c) => [c.id, c]));
}

/** The user's friends (accepted friendships), as player cards. */
export async function getFriends(userId: string): Promise<PlayerCard[]> {
  const links = await prisma.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { createdAt: "desc" },
  });
  const otherIds = links.map((l) => (l.userAId === userId ? l.userBId : l.userAId));
  if (otherIds.length === 0) return [];
  const profiles = await prisma.profile.findMany({ where: { id: { in: otherIds } } });
  const byId = await cardsById(profiles);
  // Preserve friendship recency order.
  return otherIds.map((id) => byId.get(id)).filter((c): c is PlayerCard => !!c);
}

/** Pending requests sent TO the user (to accept/decline). */
export async function getIncomingRequests(userId: string): Promise<RequestCard[]> {
  const reqs = await prisma.friendRequest.findMany({
    where: { receiverId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (reqs.length === 0) return [];
  const senders = await prisma.profile.findMany({
    where: { id: { in: reqs.map((r) => r.senderId) } },
  });
  const byId = await cardsById(senders);
  return reqs
    .map((r) => {
      const player = byId.get(r.senderId);
      return player ? { requestId: r.id, player } : null;
    })
    .filter((r): r is RequestCard => !!r);
}

/** Pending requests the user SENT (to cancel). */
export async function getOutgoingRequests(userId: string): Promise<RequestCard[]> {
  const reqs = await prisma.friendRequest.findMany({
    where: { senderId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (reqs.length === 0) return [];
  const receivers = await prisma.profile.findMany({
    where: { id: { in: reqs.map((r) => r.receiverId) } },
  });
  const byId = await cardsById(receivers);
  return reqs
    .map((r) => {
      const player = byId.get(r.receiverId);
      return player ? { requestId: r.id, player } : null;
    })
    .filter((r): r is RequestCard => !!r);
}

/** Everything the friends section needs in one round-trip. */
export async function getFriendsOverview(userId: string): Promise<{
  friends: PlayerCard[];
  incoming: RequestCard[];
  outgoing: RequestCard[];
}> {
  const [friends, incoming, outgoing] = await Promise.all([
    getFriends(userId),
    getIncomingRequests(userId),
    getOutgoingRequests(userId),
  ]);
  return { friends, incoming, outgoing };
}

/** The current player's own card (for the matchmaking "TÚ" side). */
export async function getSelfCard(userId: string): Promise<PlayerCard | null> {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) return null;
  const [card] = await toCards([profile]);
  return card ?? null;
}

/** A lobby-side card: full player card + resolved avatar art. */
export interface SelfMatchCard extends PlayerCard {
  avatarArt: CollectibleArtData | null;
}

/** A player's full lobby card (card + avatar art). Used for both seats of a
 * match room ("TÚ" and "RIVAL"). */
export async function getMatchCard(userId: string): Promise<SelfMatchCard | null> {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) return null;

  const [[card], avatarColls] = await Promise.all([
    toCards([profile]),
    getCollectiblesByIds([profile.avatarId]),
  ]);
  if (!card) return null;

  const avatar = profile.avatarId
    ? avatarColls.find((c) => c.id === profile.avatarId)
    : undefined;
  const avatarArt: CollectibleArtData | null = avatar
    ? {
        kind: avatar.kind,
        artKey: avatar.artKey,
        imageUrl: avatar.imageUrl,
        gradientFrom: avatar.gradientFrom,
        gradientTo: avatar.gradientTo,
      }
    : null;

  return { ...card, avatarArt };
}

// Transfermarket ranking. The rows are real player clubs read from the
// `profiles` table, ordered by market value (club_value) descending. The club
// name and crest come from each profile's chosen shield collectible. Read on
// the server (Server Component).
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/actions/profile";
import { getCollectiblesByIds } from "@/actions/catalog";
import { EUR_PER_MILLION } from "@/lib/money";
import type { CollectibleArtData } from "@/components/CollectibleArt";

export interface RankRow {
  pos: number;
  club: string;
  president: string;
  /** 2-letter country code. */
  country: string;
  /** Market value in full euros. */
  value: number;
  /** The club's chosen crest art (null when none picked yet). */
  art: CollectibleArtData | null;
  me: boolean;
}

/** Player clubs ranked by market value, descending, straight from `profiles`. */
export async function getTransferRanking(): Promise<RankRow[]> {
  const userId = await getAuthUserId();

  // Only profiles that finished setup (have a president name) are real clubs.
  const profiles = await prisma.profile.findMany({
    where: { presidentName: { not: null } },
    orderBy: [{ clubValue: "desc" }, { updatedAt: "asc" }],
  });

  // Resolve every club's crest (name + art) in one batched read.
  const shieldIds = profiles.map((p) => p.shieldId).filter((v): v is string => !!v);
  const crests = await getCollectiblesByIds(shieldIds);
  const crestById = new Map(crests.map((c) => [c.id, c]));

  return profiles.map((p, i) => {
    const crest = p.shieldId ? crestById.get(p.shieldId) : undefined;
    return {
      pos: i + 1,
      club: crest?.name ?? "Club sin escudo",
      president: p.presidentName ?? "Presidente",
      country: p.country ?? "",
      value: p.clubValue * EUR_PER_MILLION,
      art: crest
        ? {
            kind: crest.kind,
            artKey: crest.artKey,
            imageUrl: crest.imageUrl,
            gradientFrom: crest.gradientFrom,
            gradientTo: crest.gradientTo,
          }
        : null,
      me: p.id === userId,
    };
  });
}

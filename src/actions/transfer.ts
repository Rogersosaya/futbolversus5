// Transfermarket ranking. Rival clubs are static; the player's own club is
// merged in with its real market value (from the profile) and the whole list is
// sorted by market value, descending. Read on the server (Server Component).
import { getSessionProfile } from "@/actions/profile";
import { getCollectiblesByIds } from "@/actions/catalog";
import { EUR_PER_MILLION } from "@/lib/money";
import { TRANSFER_BASE } from "@/data/transfermarket";
import type { CrestRef } from "@/components/svg";
import type { CollectibleArtData } from "@/components/CollectibleArt";

export interface RankRow {
  pos: number;
  club: string;
  president: string;
  country: string;
  /** Market value in full euros. */
  value: number;
  /** A generated/symbol crest (rival clubs). */
  crest?: CrestRef;
  /** The player's chosen club crest art (their own row only). */
  art?: CollectibleArtData | null;
  me?: boolean;
}

/** Clubs ranked by market value, descending, with the player's club merged in. */
export async function getTransferRanking(): Promise<RankRow[]> {
  const { profile } = await getSessionProfile();

  const rows: Omit<RankRow, "pos">[] = TRANSFER_BASE.map((c) => ({ ...c }));

  if (profile) {
    let club = "Tu Club";
    let art: CollectibleArtData | null = null;
    if (profile.shieldId) {
      const [crest] = await getCollectiblesByIds([profile.shieldId]);
      if (crest) {
        club = crest.name;
        art = {
          kind: crest.kind,
          artKey: crest.artKey,
          imageUrl: crest.imageUrl,
          gradientFrom: crest.gradientFrom,
          gradientTo: crest.gradientTo,
        };
      }
    }
    rows.push({
      club,
      president: profile.presidentName ?? "Tú",
      country: profile.country ?? "",
      value: profile.clubValue * EUR_PER_MILLION,
      art,
      me: true,
    });
  }

  rows.sort((a, b) => b.value - a.value);
  return rows.map((r, i) => ({ ...r, pos: i + 1 }));
}

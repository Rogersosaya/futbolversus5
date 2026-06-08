"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createSSRClient } from "@/lib/supabase-server";
import { getLeagues, currentLeagueIndex } from "@/actions/catalog";

export interface BuyResult {
  ok: boolean;
  /** Remaining club funds (€M) after the purchase. */
  funds: number;
  error?: string;
}

/**
 * Buy a collectible with the club's funds (€M). Validates league unlock and
 * available funds, then deducts the price and equips the item. Auth comes from
 * Supabase; all data access is via Prisma.
 */
export async function buyCollectible(collectibleId: string): Promise<BuyResult> {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, funds: 0, error: "No autenticado" };

  const [profile, collectible] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id } }),
    prisma.collectible.findUnique({
      where: { id: collectibleId },
      include: { league: { select: { tier: true } } },
    }),
  ]);
  if (!profile || !collectible) return { ok: false, funds: profile?.clubFunds ?? 0, error: "No encontrado" };

  // Already equipped → no-op (treated as owned).
  const equippedId =
    collectible.kind === "CREST"
      ? profile.shieldId
      : collectible.kind === "AVATAR"
      ? profile.avatarId
      : profile.stadiumId;
  if (equippedId === collectibleId) return { ok: true, funds: profile.clubFunds };

  // League gate: can only buy from leagues already reached.
  const leagues = await getLeagues();
  const currentTier = leagues[currentLeagueIndex(leagues, profile.clubValue)]?.tier ?? 1;
  if ((collectible.league?.tier ?? 0) > currentTier) {
    return { ok: false, funds: profile.clubFunds, error: "Bloqueado por liga" };
  }

  if (profile.clubFunds < collectible.price) {
    return { ok: false, funds: profile.clubFunds, error: "Fondos insuficientes" };
  }

  const equip =
    collectible.kind === "CREST"
      ? { shieldId: collectibleId }
      : collectible.kind === "AVATAR"
      ? { avatarId: collectibleId }
      : { stadiumId: collectibleId };

  const updated = await prisma.profile.update({
    where: { id: user.id },
    data: { ...equip, clubFunds: { decrement: collectible.price }, updatedAt: new Date() },
  });

  revalidatePath("/mercado");
  revalidatePath("/club");
  revalidatePath("/");
  return { ok: true, funds: updated.clubFunds };
}

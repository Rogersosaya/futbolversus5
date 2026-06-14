"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createSSRClient } from "@/lib/supabase-server";
import { getLeagues, currentLeagueIndex } from "@/actions/catalog";
import type { CollectibleKind } from "@/generated/prisma/client";

export interface BuyResult {
  ok: boolean;
  /** Remaining club funds (€M) after the purchase. */
  funds: number;
  error?: string;
}

export interface EquipResult {
  ok: boolean;
  error?: string;
}

/** The Profile field that points to the ACTIVE collectible of a given kind. */
function activeField(kind: CollectibleKind): "shieldId" | "avatarId" | "stadiumId" {
  return kind === "CREST" ? "shieldId" : kind === "AVATAR" ? "avatarId" : "stadiumId";
}

function refreshViews() {
  revalidatePath("/mercado");
  revalidatePath("/club");
  revalidatePath("/");
}

/**
 * Buy a collectible with the club's funds (€M). Validates league unlock and
 * available funds, then adds it to the player's collection (ownership ledger)
 * and auto-equips it only if no collectible of that kind is active yet. Auth
 * comes from Supabase; all data access is via Prisma.
 */
export async function buyCollectible(collectibleId: string): Promise<BuyResult> {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, funds: 0, error: "No autenticado" };

  const [profile, collectible, alreadyOwned] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id } }),
    prisma.collectible.findUnique({
      where: { id: collectibleId },
      include: { league: { select: { tier: true } } },
    }),
    prisma.ownedCollectible.findUnique({
      where: { profileId_collectibleId: { profileId: user.id, collectibleId } },
    }),
  ]);
  if (!profile || !collectible) {
    return { ok: false, funds: profile?.clubFunds ?? 0, error: "No encontrado" };
  }

  // Already owned → no-op (treated as success; nothing to charge).
  if (alreadyOwned) return { ok: true, funds: profile.clubFunds };

  // League gate: can only buy from leagues already reached.
  const leagues = await getLeagues();
  const currentTier = leagues[currentLeagueIndex(leagues, profile.clubValue)]?.tier ?? 1;
  if ((collectible.league?.tier ?? 0) > currentTier) {
    return { ok: false, funds: profile.clubFunds, error: "Bloqueado por liga" };
  }

  if (profile.clubFunds < collectible.price) {
    return { ok: false, funds: profile.clubFunds, error: "Fondos insuficientes" };
  }

  // Auto-equip only when the slot for this kind is empty.
  const field = activeField(collectible.kind);
  const equip = profile[field] === null ? { [field]: collectibleId } : {};

  // Charge + record ownership atomically. The @@unique on (profile, collectible)
  // makes the create the race guard against a double purchase.
  const [, updated] = await prisma.$transaction([
    prisma.ownedCollectible.create({
      data: { profileId: user.id, collectibleId },
    }),
    prisma.profile.update({
      where: { id: user.id },
      data: { ...equip, clubFunds: { decrement: collectible.price }, updatedAt: new Date() },
    }),
  ]);

  refreshViews();
  return { ok: true, funds: updated.clubFunds };
}

/**
 * Set an already-owned collectible as the active one of its kind (escudo,
 * avatar or estadio). Validates that the player owns it first.
 */
export async function equipCollectible(collectibleId: string): Promise<EquipResult> {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const [owned, collectible] = await Promise.all([
    prisma.ownedCollectible.findUnique({
      where: { profileId_collectibleId: { profileId: user.id, collectibleId } },
    }),
    prisma.collectible.findUnique({
      where: { id: collectibleId },
      select: { kind: true },
    }),
  ]);
  if (!collectible) return { ok: false, error: "No encontrado" };
  if (!owned) return { ok: false, error: "No lo posees" };

  const field = activeField(collectible.kind);
  await prisma.profile.update({
    where: { id: user.id },
    data: { [field]: collectibleId, updatedAt: new Date() },
  });

  refreshViews();
  return { ok: true };
}

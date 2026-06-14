// Profile reads via Prisma. Authentication (who the user is) still comes from
// Supabase Auth cookies; the profile row itself is read with Prisma. Plain
// async functions for use in Server Components.
import { prisma } from "@/lib/prisma";
import { createSSRClient } from "@/lib/supabase-server";
import type { Profile } from "@/generated/prisma/client";

/** The authenticated user's id (from Supabase Auth), or null if signed out. */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** The signed-in user's id + profile row (or nulls when signed out). */
export async function getSessionProfile(): Promise<{
  userId: string | null;
  profile: Profile | null;
}> {
  const userId = await getAuthUserId();
  if (!userId) return { userId: null, profile: null };
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  return { userId, profile };
}

/** Ids of every collectible the player owns (their collection, not just the
 * active ones). Used by the Mercado to mark items as owned/equippable. */
export async function getOwnedCollectibleIds(userId: string): Promise<string[]> {
  const rows = await prisma.ownedCollectible.findMany({
    where: { profileId: userId },
    select: { collectibleId: true },
  });
  return rows.map((r) => r.collectibleId);
}

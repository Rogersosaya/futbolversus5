"use server";

import { prisma } from "@/lib/prisma";
import { createSSRClient } from "@/lib/supabase-server";

export async function updateProfile(data: {
  presidentName: string;
  country: string;
  avatarId: string;
  stadiumId: string;
  shieldId: string;
}) {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // First-login setup: the three starter picks become active AND owned (free
  // onboarding gift — no funds are charged). They seed the player's collection.
  await prisma.$transaction([
    prisma.ownedCollectible.createMany({
      data: [data.avatarId, data.stadiumId, data.shieldId].map((collectibleId) => ({
        profileId: user.id,
        collectibleId,
      })),
      skipDuplicates: true,
    }),
    prisma.profile.update({
      where: { id: user.id },
      data: {
        presidentName: data.presidentName,
        country: data.country,
        avatarId: data.avatarId,
        stadiumId: data.stadiumId,
        shieldId: data.shieldId,
        updatedAt: new Date(),
      },
    }),
  ]);
}

export async function signOut() {
  const supabase = await createSSRClient();
  await supabase.auth.signOut();
}

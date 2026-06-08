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

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      presidentName: data.presidentName,
      country: data.country,
      avatarId: data.avatarId,
      stadiumId: data.stadiumId,
      shieldId: data.shieldId,
      updatedAt: new Date(),
    },
  });
}

export async function signOut() {
  const supabase = await createSSRClient();
  await supabase.auth.signOut();
}

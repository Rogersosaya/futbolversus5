"use server";

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

  const { error } = await supabase
    .from("profiles")
    .update({
      president_name: data.presidentName,
      country: data.country,
      avatar_id: data.avatarId,
      stadium_id: data.stadiumId,
      shield_id: data.shieldId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
}

export async function signOut() {
  const supabase = await createSSRClient();
  await supabase.auth.signOut();
}

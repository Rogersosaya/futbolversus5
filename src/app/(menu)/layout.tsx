import type { ReactNode } from "react";

import { SvgSymbols } from "@/components/SvgSymbols";
import { GameShell } from "@/components/GameShell";
import { Topbar } from "@/components/Topbar";
import { HomeNav } from "@/components/HomeNav";
import { ViewFrame } from "@/components/ViewFrame";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import { ProfileProvider } from "@/components/ProfileContext";
import { createSSRClient } from "@/lib/supabase-server";
import { countryByCode } from "@/data/game-assets";
import type { LiveProfile } from "@/components/ProfileContext";

async function getSessionAndProfile() {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

export default async function MenuLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getSessionAndProfile();

  const needsSetup =
    !profile?.president_name ||
    !profile?.country ||
    !profile?.stadium_id ||
    !profile?.avatar_id ||
    !profile?.shield_id;

  const displayName = profile?.president_name ?? "Presidente";
  const budget: number = profile?.budget ?? 0;

  const liveProfile: LiveProfile = {
    presidentName: profile?.president_name ?? "Presidente",
    country: profile?.country ?? "",
    countryName: countryByCode(profile?.country ?? "")?.name ?? "",
    avatarId: profile?.avatar_id ?? null,
    stadiumId: profile?.stadium_id ?? null,
    shieldId: profile?.shield_id ?? null,
    marketValue: profile?.market_value ?? 0,
    budget: profile?.budget ?? 0,
  };

  return (
    <GameShell>
      <SvgSymbols />
      <section className="screen active" data-screen="menu" data-screen-label="Menú principal">
        <div className="bg">
          <div className="streaks" />
          <div className="vignette" />
        </div>

        <Topbar>
          <span>Temporada 2026</span>
          <span className="coin">
            <i /> {budget.toLocaleString("es")}
          </span>
          <span className="who">
            {displayName}{" "}
            <u
              className={`av${profile?.avatar_id ? ` av-${profile.avatar_id}` : ""}`}
              aria-hidden="true"
            />
          </span>
        </Topbar>

        <div className="home">
          <HomeNav />
          <div className="home-content">
            <ProfileProvider profile={liveProfile}>
              <ViewFrame>{children}</ViewFrame>
            </ProfileProvider>
          </div>
        </div>
      </section>

      {user && needsSetup && <ProfileSetupModal userId={user.id} />}
    </GameShell>
  );
}

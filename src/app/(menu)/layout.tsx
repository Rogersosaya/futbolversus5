import type { ReactNode } from "react";

import { SvgSymbols } from "@/components/SvgSymbols";
import { GameShell } from "@/components/GameShell";
import { Topbar } from "@/components/Topbar";
import { HomeNav } from "@/components/HomeNav";
import { ViewFrame } from "@/components/ViewFrame";
import { ProfileSetupModal, type SetupOptions } from "@/components/ProfileSetupModal";
import { AuthButton } from "@/components/AuthButton";
import { NotificationsBell } from "@/components/NotificationsBell";
import { ProfileProvider } from "@/components/ProfileContext";
import { CollectibleGlyph, type CollectibleArtData } from "@/components/CollectibleArt";
import { Money, EUR_PER_MILLION } from "@/components/Money";
import { countryByCode } from "@/data/game-assets";
import {
  getLeagueCollectibles,
  getLeagues,
  getCollectiblesByIds,
  currentLeagueIndex,
  type Collectible,
} from "@/actions/catalog";
import { getSessionProfile } from "@/actions/profile";
import { getIncomingRequests } from "@/actions/friends";
import type { LiveProfile } from "@/components/ProfileContext";

const toArt = (c: Collectible | undefined): CollectibleArtData | null =>
  c
    ? {
        kind: c.kind,
        artKey: c.artKey,
        imageUrl: c.imageUrl,
        gradientFrom: c.gradientFrom,
        gradientTo: c.gradientTo,
      }
    : null;

export default async function MenuLayout({ children }: { children: ReactNode }) {
  const { userId, profile } = await getSessionProfile();

  const needsSetup =
    !profile?.presidentName ||
    !profile?.country ||
    !profile?.stadiumId ||
    !profile?.avatarId ||
    !profile?.shieldId;

  const displayName = profile?.presidentName ?? "Presidente";
  const clubFunds = profile?.clubFunds ?? 0;

  // Pending friend requests for the notification bell (live-updated client-side).
  const incomingRequests = userId ? await getIncomingRequests(userId) : [];

  // Derive the player's current league from club value (Liga 1 at value 0).
  const leagues = await getLeagues();
  const clubValue = profile?.clubValue ?? 0;
  const current = leagues[currentLeagueIndex(leagues, clubValue)];

  // First-login setup: options come from the collectibles available in the
  // league the club currently sits in. Only loaded when setup is pending.
  let setupOptions: SetupOptions | null = null;
  if (userId && needsSetup && current) {
    const available = await getLeagueCollectibles(current.id);
    setupOptions = {
      avatars: available.filter((c) => c.kind === "AVATAR"),
      stadiums: available.filter((c) => c.kind === "STADIUM"),
      shields: available.filter((c) => c.kind === "CREST"),
    };
  }

  // Resolve the chosen cosmetics to their art (for the topbar/club/landing).
  const chosen = await getCollectiblesByIds([
    profile?.avatarId,
    profile?.stadiumId,
    profile?.shieldId,
  ]);
  const byId = new Map(chosen.map((c) => [c.id, c]));
  const avatarColl = profile?.avatarId ? byId.get(profile.avatarId) : undefined;
  const stadiumColl = profile?.stadiumId ? byId.get(profile.stadiumId) : undefined;
  const shieldColl = profile?.shieldId ? byId.get(profile.shieldId) : undefined;
  const avatarArt = toArt(avatarColl);
  const stadiumArt = toArt(stadiumColl);
  const shieldArt = toArt(shieldColl);

  const liveProfile: LiveProfile = {
    id: userId,
    presidentName: profile?.presidentName ?? "Presidente",
    country: profile?.country ?? "",
    countryName: countryByCode(profile?.country ?? "")?.name ?? "",
    avatarId: profile?.avatarId ?? null,
    stadiumId: profile?.stadiumId ?? null,
    shieldId: profile?.shieldId ?? null,
    clubName: shieldColl?.name ?? null,
    stadiumName: stadiumColl?.name ?? null,
    avatarArt,
    stadiumArt,
    shieldArt,
    clubValue,
    clubFunds: profile?.clubFunds ?? 0,
    budget: profile?.budget ?? 0,
    currentLeague: current
      ? { name: current.name, country: current.country, countryCode: current.countryCode }
      : null,
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
          <span className="stat">
            <span className="stat-label">Valor del club</span>
            <Money euros={clubValue * EUR_PER_MILLION} kind="value" />
          </span>
          <span className="stat">
            <span className="stat-label">Fondos del club</span>
            <Money euros={clubFunds * EUR_PER_MILLION} kind="funds" />
          </span>
          <span className="who">
            {displayName}{" "}
            <u className="av av-img" aria-hidden="true">
              {avatarArt && <CollectibleGlyph c={avatarArt} />}
            </u>
          </span>
          {userId && <NotificationsBell userId={userId} initialIncoming={incomingRequests} />}
          <AuthButton loggedIn={!!userId} />
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

      {userId && needsSetup && setupOptions && (
        <ProfileSetupModal userId={userId} options={setupOptions} />
      )}
    </GameShell>
  );
}

import { getLeagues, getCollectibles, currentLeagueIndex } from "@/actions/catalog";
import { getSessionProfile, getOwnedCollectibleIds } from "@/actions/profile";

import { MercadoView } from "./MercadoView";

/** Mercado view — buy escudos, avatares and estadios; gated by league progress. */
export default async function MercadoPage() {
  const [leagues, collectibles, session] = await Promise.all([
    getLeagues(),
    getCollectibles(),
    getSessionProfile(),
  ]);

  const profile = session.profile;
  const value = profile?.clubValue ?? 0;
  const currentIdx = currentLeagueIndex(leagues, value);
  const currentTier = leagues[currentIdx]?.tier ?? 1;

  // Owned = the player's whole collection (ledger). Active = the one of each
  // kind currently in use, shown as "EN USO".
  const ownedIds = session.userId ? await getOwnedCollectibleIds(session.userId) : [];
  const activeIds = [profile?.shieldId, profile?.avatarId, profile?.stadiumId].filter(
    (v): v is string => !!v,
  );

  return (
    <MercadoView
      items={collectibles}
      currentTier={currentTier}
      ownedIds={ownedIds}
      activeIds={activeIds}
      funds={profile?.clubFunds ?? 0}
    />
  );
}

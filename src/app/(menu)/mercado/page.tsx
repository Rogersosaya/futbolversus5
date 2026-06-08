import { getLeagues, getCollectibles, currentLeagueIndex } from "@/actions/catalog";
import { getSessionProfile } from "@/actions/profile";

import { MercadoView } from "./MercadoView";

/** Mercado view — buy escudos, avatares and estadios; gated by league progress. */
export default async function MercadoPage() {
  const [leagues, collectibles, session] = await Promise.all([
    getLeagues(),
    getCollectibles(),
    getSessionProfile(),
  ]);

  const profile = session.profile;
  const value = profile?.marketValue ?? 0;
  const currentIdx = currentLeagueIndex(leagues, value);
  const currentTier = leagues[currentIdx]?.tier ?? 1;

  // A pick the player already wears (matched by id) is shown as owned.
  const owned = new Set(
    [profile?.shieldId, profile?.avatarId, profile?.stadiumId].filter(
      (v): v is string => !!v,
    ),
  );

  return <MercadoView items={collectibles} currentTier={currentTier} ownedIds={[...owned]} />;
}

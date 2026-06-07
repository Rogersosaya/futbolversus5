/**
 * The signed-in player ("president") profile. Static for now; will later be
 * sourced from Supabase per authenticated user.
 */
export interface PlayerProfile {
  name: string;
  avatar: string;
  country: string;
  countryFlag: string;
  club: string;
  clubCrest: "crest-rma";
  coins: string;
  season: string;
}

export const PROFILE: PlayerProfile = {
  name: "Roger",
  avatar: "/assets/messi-avatar.png",
  country: "Perú",
  countryFlag: "pe",
  club: "Real Madrid",
  clubCrest: "crest-rma",
  coins: "184 500",
  season: "Temporada 2026",
};

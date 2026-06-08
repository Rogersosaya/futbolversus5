"use client";

import { createContext, use } from "react";
import type { ReactNode } from "react";

import type { CollectibleArtData } from "@/components/CollectibleArt";

/** The league the player currently sits in, derived from market value. */
export interface CurrentLeague {
  name: string;
  country: string;
  /** Flag symbol code, e.g. "pe", "gb". */
  countryCode: string;
}

export interface LiveProfile {
  presidentName: string;
  /** 2-letter ISO country code stored in DB, e.g. "ar" */
  country: string;
  countryName: string;
  avatarId: string | null;
  stadiumId: string | null;
  shieldId: string | null;
  /** Resolved art for the chosen cosmetics (null when none/legacy value). */
  avatarArt: CollectibleArtData | null;
  stadiumArt: CollectibleArtData | null;
  shieldArt: CollectibleArtData | null;
  marketValue: number;
  budget: number;
  currentLeague: CurrentLeague | null;
}

const ProfileCtx = createContext<LiveProfile>({
  presidentName: "Presidente",
  country: "",
  countryName: "",
  avatarId: null,
  stadiumId: null,
  shieldId: null,
  avatarArt: null,
  stadiumArt: null,
  shieldArt: null,
  marketValue: 0,
  budget: 0,
  currentLeague: null,
});

export function ProfileProvider({
  profile,
  children,
}: {
  profile: LiveProfile;
  children: ReactNode;
}) {
  return <ProfileCtx value={profile}>{children}</ProfileCtx>;
}

export function useProfile(): LiveProfile {
  return use(ProfileCtx);
}

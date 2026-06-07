"use client";

import { createContext, use } from "react";
import type { ReactNode } from "react";

export interface LiveProfile {
  presidentName: string;
  /** 2-letter ISO country code stored in DB, e.g. "ar" */
  country: string;
  countryName: string;
  avatarId: string | null;
  stadiumId: string | null;
  shieldId: string | null;
  marketValue: number;
  budget: number;
}

const ProfileCtx = createContext<LiveProfile>({
  presidentName: "Presidente",
  country: "",
  countryName: "",
  avatarId: null,
  stadiumId: null,
  shieldId: null,
  marketValue: 0,
  budget: 0,
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

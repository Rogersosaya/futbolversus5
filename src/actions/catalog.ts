// Catalogue reads (leagues + collectibles) via Prisma. Plain async functions
// for use in Server Components. These are public, read-only tables.
import { prisma } from "@/lib/prisma";

export type CollectibleKind = "CREST" | "AVATAR" | "STADIUM";
export type Rarity = "LEGEND" | "EPIC" | "RARE" | "COMMON";

export interface League {
  id: string;
  code: string;
  name: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  tier: number;
  minMarketValue: number;
  maxMarketValue: number | null;
}

export interface Collectible {
  id: string;
  kind: CollectibleKind;
  name: string;
  artKey: string | null;
  imageUrl: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  rarity: Rarity;
  price: number;
  isStarter: boolean;
  sortOrder: number;
  leagueId: string;
  /** Tier of the owning league — drives unlock ordering in the UI. */
  leagueTier: number;
  leagueCode: string;
  leagueName: string;
  leagueCountry: string;
  leagueCountryCode: string;
}

/* ─── Mappers (Prisma row → plain serializable domain object) ─── */

type LeagueModel = {
  id: string;
  code: string;
  name: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  tier: number;
  minMarketValue: number;
  maxMarketValue: number | null;
};

function mapLeague(l: LeagueModel): League {
  return {
    id: l.id,
    code: l.code,
    name: l.name,
    country: l.country,
    countryCode: l.countryCode,
    imageUrl: l.imageUrl,
    tier: l.tier,
    minMarketValue: l.minMarketValue,
    maxMarketValue: l.maxMarketValue,
  };
}

type CollectibleModel = {
  id: string;
  kind: CollectibleKind;
  name: string;
  artKey: string | null;
  imageUrl: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  rarity: Rarity;
  price: number;
  isStarter: boolean;
  sortOrder: number;
  leagueId: string;
  league: { tier: number; code: string; name: string; country: string; countryCode: string } | null;
};

function mapCollectible(c: CollectibleModel): Collectible {
  return {
    id: c.id,
    kind: c.kind,
    name: c.name,
    artKey: c.artKey,
    imageUrl: c.imageUrl,
    gradientFrom: c.gradientFrom,
    gradientTo: c.gradientTo,
    rarity: c.rarity,
    price: c.price,
    isStarter: c.isStarter,
    sortOrder: c.sortOrder,
    leagueId: c.leagueId,
    leagueTier: c.league?.tier ?? 0,
    leagueCode: c.league?.code ?? "",
    leagueName: c.league?.name ?? "",
    leagueCountry: c.league?.country ?? "",
    leagueCountryCode: c.league?.countryCode ?? "",
  };
}

const LEAGUE_BRIEF = {
  select: { tier: true, code: true, name: true, country: true, countryCode: true },
} as const;

/* ─── Queries ─── */

export async function getLeagues(): Promise<League[]> {
  const rows = await prisma.league.findMany({ orderBy: { tier: "asc" } });
  return rows.map(mapLeague);
}

export async function getCollectibles(): Promise<Collectible[]> {
  const rows = await prisma.collectible.findMany({
    include: { league: LEAGUE_BRIEF },
    orderBy: [{ league: { tier: "asc" } }, { sortOrder: "asc" }],
  });
  return rows.map((r) => mapCollectible(r as CollectibleModel));
}

/**
 * Collectibles available in a single league, by kind. Used for first-login
 * profile setup, where the player picks from the cosmetics unlocked in the
 * league their club currently sits in (Liga 1 for a brand-new account).
 */
export async function getLeagueCollectibles(leagueId: string): Promise<Collectible[]> {
  const rows = await prisma.collectible.findMany({
    where: { leagueId },
    include: { league: LEAGUE_BRIEF },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
  });
  return rows.map((r) => mapCollectible(r as CollectibleModel));
}

/** Resolve specific collectibles by id (e.g. a profile's chosen cosmetics). */
export async function getCollectiblesByIds(ids: (string | null | undefined)[]): Promise<Collectible[]> {
  const clean = [...new Set(ids.filter((v): v is string => !!v))];
  if (clean.length === 0) return [];
  const rows = await prisma.collectible.findMany({
    where: { id: { in: clean } },
    include: { league: LEAGUE_BRIEF },
  });
  return rows.map((r) => mapCollectible(r as CollectibleModel));
}

/* ─── Progression helpers (pure) ─── */

/** Index (0-based) into a tier-sorted league list for the given market value. */
export function currentLeagueIndex(leagues: League[], value: number): number {
  let idx = 0;
  leagues.forEach((l, i) => {
    if (value >= l.minMarketValue) idx = i;
  });
  return idx;
}

export interface LeagueProgress {
  league: League | undefined;
  next: League | undefined;
  value: number;
  /** Percent of the way to the next league (0–100). */
  pct: number;
  /** €M still needed to ascend. */
  need: number;
}

export function leagueProgress(leagues: League[], value: number): LeagueProgress {
  const i = currentLeagueIndex(leagues, value);
  const league = leagues[i];
  const next = leagues[i + 1];
  const span = next && league ? next.minMarketValue - league.minMarketValue : 0;
  const pct = next && league && span > 0
    ? Math.min(100, Math.max(0, Math.round(((value - league.minMarketValue) / span) * 100)))
    : 100;
  return { league, next, value, pct, need: next ? Math.max(0, next.minMarketValue - value) : 0 };
}

/**
 * League progression ("Ruta de Ligas"). Each league unlocks at a market-value
 * threshold and grants new clubs/avatars/stadiums in the store.
 */
export interface League {
  id: string;
  name: string;
  country: string;
  flag: string;
  /** Market value (in €M) required to reach this league. */
  req: number;
  clubs: number;
  avatars: number;
  stadiums: number;
  tag: string;
}

export const LEAGUES: League[] = [
  { id: "pe", name: "Liga 1", country: "Perú", flag: "pe", req: 0, clubs: 6, avatars: 3, stadiums: 2, tag: "#9aa3b2" },
  { id: "ar", name: "Liga Profesional", country: "Argentina", flag: "ar", req: 20, clubs: 8, avatars: 3, stadiums: 3, tag: "#75AADB" },
  { id: "br", name: "Brasileirão", country: "Brasil", flag: "br", req: 45, clubs: 8, avatars: 4, stadiums: 3, tag: "#1ea65a" },
  { id: "fr", name: "Ligue 1", country: "Francia", flag: "fr", req: 80, clubs: 6, avatars: 4, stadiums: 3, tag: "#5b8cff" },
  { id: "it", name: "Serie A", country: "Italia", flag: "it", req: 130, clubs: 8, avatars: 5, stadiums: 4, tag: "#3ea36a" },
  { id: "de", name: "Bundesliga", country: "Alemania", flag: "de", req: 190, clubs: 7, avatars: 5, stadiums: 4, tag: "#e8c93a" },
  { id: "es", name: "LaLiga", country: "España", flag: "es", req: 260, clubs: 10, avatars: 6, stadiums: 5, tag: "#e0b53a" },
  { id: "en", name: "Premier League", country: "Inglaterra", flag: "gb", req: 350, clubs: 12, avatars: 8, stadiums: 6, tag: "#c44b6a" },
];

/** Current market value of the player's club, in €M. */
export const CUR_VALUE = 58;

/** Index of the highest league whose threshold the player has reached. */
export function currentLeagueIndex(value = CUR_VALUE): number {
  let idx = 0;
  LEAGUES.forEach((l, i) => {
    if (value >= l.req) idx = i;
  });
  return idx;
}

export interface LeagueProgress {
  league: League;
  next: League | undefined;
  value: number;
  /** Percent of the way to the next league (0–100). */
  pct: number;
  /** €M still needed to ascend. */
  need: number;
}

export function currentLeagueInfo(value = CUR_VALUE): LeagueProgress {
  const i = currentLeagueIndex(value);
  const league = LEAGUES[i];
  const next = LEAGUES[i + 1];
  const pct = next ? Math.round(((value - league.req) / (next.req - league.req)) * 100) : 100;
  return { league, next, value, pct, need: next ? next.req - value : 0 };
}

export function findLeague(id: string): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}

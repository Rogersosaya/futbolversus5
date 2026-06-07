/** Standings screen: group table + fixtures for CONMEBOL Libertadores 2026. */
import type { CrestId } from "@/components/svg";

/** Continental qualification band shown as a colored bar in the table. */
export type QualBand = "q1" | "q2" | "none";

export interface StandingRow {
  pos: number;
  team: string;
  crest: CrestId;
  qual: QualBand;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  /** Goal difference, pre-formatted with sign (e.g. "+3", "−4"). */
  gd: string;
  pts: number;
  me?: boolean;
}

export const GROUP_LABEL = "GRUPO H";
export const GROUPS = ["E", "F", "G", "H"];
export const ACTIVE_GROUP = "H";

export const STANDINGS: StandingRow[] = [
  { pos: 1, team: "Universitario", crest: "crest-uni", qual: "q1", played: 3, won: 2, drawn: 1, lost: 0, gf: 5, ga: 2, gd: "+3", pts: 7, me: true },
  { pos: 2, team: "Nacional", crest: "crest-nac", qual: "q1", played: 3, won: 1, drawn: 2, lost: 0, gf: 4, ga: 3, gd: "+1", pts: 5 },
  { pos: 3, team: "Fluminense", crest: "crest-flu", qual: "q2", played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: "0", pts: 4 },
  { pos: 4, team: "Colo-Colo", crest: "crest-col", qual: "none", played: 3, won: 0, drawn: 0, lost: 3, gf: 1, ga: 5, gd: "−4", pts: 0 },
];

export interface Fixture {
  status: string;
  home: { team: string; crest: CrestId };
  away: { team: string; crest: CrestId };
  /** Pre-formatted score; null when not played yet (shows "— : —"). */
  score: string | null;
}

export const FIXTURES: Fixture[] = [
  {
    status: "HOY · 21:00",
    home: { team: "Universitario", crest: "crest-uni" },
    away: { team: "Nacional", crest: "crest-nac" },
    score: null,
  },
  {
    status: "FINALIZADO",
    home: { team: "Fluminense", crest: "crest-flu" },
    away: { team: "Colo-Colo", crest: "crest-col" },
    score: "2 : 1",
  },
];

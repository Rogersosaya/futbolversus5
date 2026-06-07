/** VS selection, lineup and live-match HUD data for the showcased fixture. */
import type { CrestId } from "@/components/svg";

export interface VsTeam {
  country: string;
  flag: string;
  name: string;
  crest: CrestId;
  /** Star fill percentage (e.g. "60%"). */
  starFill: string;
  stats: { label: string; value: number }[];
}

export const VS_HOME: VsTeam = {
  country: "Perú",
  flag: "pe",
  name: "Universitario",
  crest: "crest-uni",
  starFill: "60%",
  stats: [
    { label: "DEL", value: 70 },
    { label: "MED", value: 71 },
    { label: "DEF", value: 70 },
  ],
};

export const VS_AWAY: VsTeam = {
  country: "Uruguay",
  flag: "uy",
  name: "Nacional",
  crest: "crest-nac",
  starFill: "70%",
  stats: [
    { label: "DEL", value: 74 },
    { label: "MED", value: 69 },
    { label: "DEF", value: 71 },
  ],
};

export const VS_CENTER = {
  round: "Fecha 3",
  venue: { primary: "Estadio Monumental", secondary: "“U” Marathon" },
};

/** Lineup screen — team header, formation, stats and the on-pitch squad. */
export interface SquadPlayer {
  number: number;
  name: string;
  /** Player rating. */
  rating: number;
  /** Position on the pitch as percentages (attacking upward). */
  x: number;
  y: number;
}

export const LINEUP = {
  team: { name: "UNIVERSITARIO", sub: "Local · Perú", crest: "crest-uni" as CrestId },
  formation: { number: "4-3-3", label: "FORMACIÓN\nOFENSIVA" },
  stats: [
    { label: "DEL", value: 70 },
    { label: "MED", value: 71 },
    { label: "DEF", value: 70 },
    { label: "GEN", value: 70, overall: true },
  ],
  squad: [
    { number: 1, name: "Britos", rating: 71, x: 50, y: 92 },
    { number: 4, name: "Riveros", rating: 69, x: 78, y: 74 },
    { number: 2, name: "Aldo C.", rating: 72, x: 60, y: 80 },
    { number: 6, name: "Pérez", rating: 70, x: 40, y: 80 },
    { number: 3, name: "Polo", rating: 68, x: 22, y: 74 },
    { number: 8, name: "Concha", rating: 72, x: 70, y: 54 },
    { number: 5, name: "Inga", rating: 71, x: 50, y: 58 },
    { number: 10, name: "Rivera", rating: 74, x: 30, y: 54 },
    { number: 7, name: "Flores", rating: 70, x: 78, y: 30 },
    { number: 9, name: "Valera", rating: 75, x: 50, y: 22 },
    { number: 11, name: "Ramos", rating: 69, x: 22, y: 30 },
  ] satisfies SquadPlayer[],
};

/** Live match HUD (scoreboard, event toast, radar, possession). */
export interface RadarDot {
  side: "h" | "a" | "ball";
  left: number;
  top: number;
}

export const MATCH_HUD = {
  home: { ab: "UNI", crest: "crest-uni" as CrestId, score: 1 },
  away: { ab: "NAC", crest: "crest-nac" as CrestId, score: 0 },
  clock: { time: "67'", half: "2T" },
  event: { badge: "GOL", player: "A. Valera", detail: "63' — Universitario" },
  possession: { home: 58, away: 42 },
  radar: [
    { side: "h", left: 22, top: 30 },
    { side: "h", left: 30, top: 60 },
    { side: "h", left: 44, top: 42 },
    { side: "h", left: 38, top: 78 },
    { side: "a", left: 64, top: 34 },
    { side: "a", left: 70, top: 66 },
    { side: "a", left: 58, top: 50 },
    { side: "a", left: 80, top: 48 },
    { side: "ball", left: 52, top: 46 },
  ] satisfies RadarDot[],
};

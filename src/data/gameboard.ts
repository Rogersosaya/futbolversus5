/** "Once Mundialista" game board: two facing 4-3-3 grids the players fill. */
import type { CrestRef } from "@/components/svg";

export interface BoardSide {
  name: string;
  president: string;
  crest: CrestRef;
  /** Token color for cells owned by this side. */
  own: string;
  /** Glow color (rgba) for owned cells. */
  glow: string;
}

export const GAME_ME: BoardSide = {
  name: "Real Madrid",
  president: "Roger",
  crest: { kind: "symbol", id: "crest-rma" },
  own: "#eef1f7",
  glow: "rgba(238,241,247,.75)",
};

export const GAME_OPP: BoardSide = {
  name: "Flamengo",
  president: "Carlos_DT",
  crest: { kind: "mini", initials: "FLA", fill: "#c8102e", stroke: "#101418" },
  own: "#e8344f",
  glow: "rgba(232,52,79,.75)",
};

export interface BoardCell {
  id: string;
  /** Horizontal position (%). */
  x: number;
  /** Vertical position (%). */
  y: number;
  /** Position label shown on empty cells. */
  pos: string;
}

const LEFT: BoardCell[] = [
  { id: "l-gk", x: 6, y: 50, pos: "POR" },
  { id: "l-d1", x: 18, y: 15, pos: "LD" },
  { id: "l-d2", x: 18, y: 38, pos: "DFC" },
  { id: "l-d3", x: 18, y: 62, pos: "DFC" },
  { id: "l-d4", x: 18, y: 85, pos: "LI" },
  { id: "l-m1", x: 30, y: 27, pos: "MC" },
  { id: "l-m2", x: 30, y: 50, pos: "MC" },
  { id: "l-m3", x: 30, y: 73, pos: "MC" },
  { id: "l-f1", x: 42, y: 22, pos: "ED" },
  { id: "l-f2", x: 42, y: 50, pos: "DC" },
  { id: "l-f3", x: 42, y: 78, pos: "EI" },
];

const RIGHT: BoardCell[] = [
  { id: "r-gk", x: 94, y: 50, pos: "POR" },
  { id: "r-d1", x: 82, y: 15, pos: "LD" },
  { id: "r-d2", x: 82, y: 38, pos: "DFC" },
  { id: "r-d3", x: 82, y: 62, pos: "DFC" },
  { id: "r-d4", x: 82, y: 85, pos: "LI" },
  { id: "r-m1", x: 70, y: 27, pos: "MC" },
  { id: "r-m2", x: 70, y: 50, pos: "MC" },
  { id: "r-m3", x: 70, y: 73, pos: "MC" },
  { id: "r-f1", x: 58, y: 22, pos: "ED" },
  { id: "r-f2", x: 58, y: 50, pos: "DC" },
  { id: "r-f3", x: 58, y: 78, pos: "EI" },
];

export const BOARD_CELLS: BoardCell[] = [...LEFT, ...RIGHT];

export interface FilledCell {
  by: "me" | "op";
  name: string;
  /** Nationality flag code. */
  flag: string;
  /** Optional player photo. */
  photo?: string;
}

export const BOARD_FILL: Record<string, FilledCell> = {
  "l-gk": { by: "me", name: "Courtois", flag: "be" },
  "l-d2": { by: "me", name: "Rüdiger", flag: "de" },
  "l-d4": { by: "me", name: "Carvajal", flag: "es" },
  "l-m2": { by: "me", name: "Modrić", flag: "hr" },
  "l-f1": { by: "me", name: "Vinícius", flag: "br", photo: "/assets/messi-avatar.png" },
  "l-f2": { by: "me", name: "Bellingham", flag: "gb" },
  "r-m2": { by: "me", name: "Valverde", flag: "uy" },
  "r-d1": { by: "op", name: "T. Hernández", flag: "fr" },
  "r-d4": { by: "op", name: "Van Dijk", flag: "nl" },
  "r-m3": { by: "op", name: "Barella", flag: "it" },
  "r-f1": { by: "op", name: "R. Leão", flag: "pt" },
  "r-f2": { by: "op", name: "L. Martínez", flag: "ar" },
};

/** Currently selected empty cell. */
export const SELECTED_CELL = "l-m1";

/** Country currently in play (the answer must be from here). */
export const ACTIVE_COUNTRY = { flag: "pe", name: "PERÚ" };

/** Demo names that drop into the selected cell when a side scores. */
export const SELECTED_FILL = {
  mine: { name: "Cueva", flag: "pe" },
  rival: { name: "Carrillo", flag: "pe" },
};

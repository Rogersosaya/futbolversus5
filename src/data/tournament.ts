/** Torneos screen: Copa FUTBOL VERSUS layout data. */

export interface Prize {
  position: string;
  amount: string;
  cls: "gold" | "silver" | "bronze";
  /** Podium bar height in px. */
  height: number;
}

/** Ordered for the podium row: 2nd, 1st, 3rd. */
export const PRIZES: Prize[] = [
  { position: "2°", amount: "$2,000", cls: "silver", height: 78 },
  { position: "1°", amount: "$5,000", cls: "gold", height: 112 },
  { position: "3°", amount: "$1,000", cls: "bronze", height: 58 },
];

export interface Phase {
  n: string;
  title: string;
  desc: string;
  ic: string;
}

export const PHASES: Phase[] = [
  { n: "01", title: "Fase de Liga", desc: "36 clubes · 8 fechas · tabla única", ic: "ic-table" },
  { n: "02", title: "16vos · Repechaje", desc: "Puestos 9° a 16° · ida y vuelta", ic: "ic-swap" },
  { n: "03", title: "Octavos a Final", desc: "Top 8 clasifica directo · eliminación", ic: "ic-cup" },
];

export const TOURNAMENT_META = [
  { label: "CUPOS", value: "36 clubes" },
  { label: "FORMATO", value: "Liga + Eliminatoria" },
  { label: "INICIO", value: "Por anunciar" },
];

/** Bracket columns (rounds) with the number of ties and the placeholder label. */
export const BRACKET_COLUMNS = [
  { title: "OCTAVOS", ties: 4, label: "Por definir" },
  { title: "CUARTOS", ties: 2, label: "—" },
  { title: "SEMIS", ties: 1, label: "—" },
];

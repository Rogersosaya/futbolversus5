/** "Mi Club" profile: KPIs and match/minigame history. */

export type HistoryCategory = "liga" | "amistoso" | "desafio" | "torneo";
export type MatchResult = "win" | "loss" | "draw";

export interface HistoryEntry {
  cat: HistoryCategory;
  ic: string;
  title: string;
  sub: string;
  result: MatchResult;
  score: string;
  when: string;
}

export const HISTORY: HistoryEntry[] = [
  { cat: "liga", ic: "ic-ball", title: "Partido de Liga", sub: "vs Boca Juniors · La Bombonera", result: "win", score: "4 — 2", when: "Hace 2 h" },
  { cat: "desafio", ic: "ic-bolt", title: "Reacción Rápida", sub: "Contrarreloj · Titular", result: "win", score: "12 aciertos", when: "Hoy" },
  { cat: "torneo", ic: "ic-cup", title: "Copa FUTBOL VERSUS", sub: "Fase de Liga · Fecha 3", result: "draw", score: "2 — 2", when: "Ayer" },
  { cat: "amistoso", ic: "ic-question", title: "¿Quién Soy?", sub: "Amistoso · Leyenda", result: "win", score: "8 / 8", when: "Ayer" },
  { cat: "liga", ic: "ic-ball", title: "Partido de Liga", sub: "vs Universitario · Monumental", result: "loss", score: "1 — 3", when: "2 días" },
  { cat: "desafio", ic: "ic-eleven", title: "Arma el Once", sub: "Contrarreloj · Canterano", result: "win", score: "Racha 3", when: "3 días" },
  { cat: "amistoso", ic: "ic-shield", title: "Escudos", sub: "Amistoso · Titular", result: "loss", score: "5 / 10", when: "4 días" },
  { cat: "torneo", ic: "ic-cup", title: "Copa FUTBOL VERSUS", sub: "Fase de Liga · Fecha 2", result: "win", score: "3 — 0", when: "5 días" },
];

export const HISTORY_FILTERS: { key: "todos" | HistoryCategory; label: string }[] = [
  { key: "todos", label: "TODOS" },
  { key: "liga", label: "LIGA" },
  { key: "amistoso", label: "AMISTOSO" },
  { key: "desafio", label: "DESAFÍO" },
  { key: "torneo", label: "TORNEOS" },
];

export const RESULT_BADGE: Record<MatchResult, { label: string; cls: string }> = {
  win: { label: "GANADO", cls: "win" },
  loss: { label: "PERDIDO", cls: "loss" },
  draw: { label: "EMPATE", cls: "draw" },
};

export interface ClubKpi {
  value: string;
  label: string;
  coin?: boolean;
}

export const CLUB_KPIS: ClubKpi[] = [
  { value: "#8", label: "RANKING" },
  { value: "184.5K", label: "VALOR", coin: true },
  { value: "71%", label: "VICTORIAS" },
  { value: "5", label: "TROFEOS" },
];

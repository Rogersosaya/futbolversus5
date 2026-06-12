/** "Mi Club" profile: KPIs and match/minigame history (entries come from the
 * DB via src/actions/history.ts — only the UI metadata lives here). */

export type HistoryCategory = "liga" | "amistoso" | "desafio" | "torneo";
export type MatchResult = "win" | "loss" | "draw";

export interface HistoryEntry {
  id: string;
  cat: HistoryCategory;
  ic: string;
  title: string;
  sub: string;
  result: MatchResult;
  score: string;
  /** Epoch ms — formatted client-side in the user's timezone. */
  finishedAt: number;
}

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

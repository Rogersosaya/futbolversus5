/** Minigame catalogue shared by the Amistoso and Desafío Individual screens. */

export interface MiniGame {
  id: string;
  /** `ic-*` symbol id for the artwork glyph. */
  ic: string;
  /** Two-stop gradient [from, to] for the art tile. */
  gradient: [string, string];
  title: string;
  desc: string;
  tags: string[];
}

/** Amistoso minigames (with marketing copy + tags). */
export const GAMES: MiniGame[] = [
  { id: "g1", ic: "ic-question", gradient: ["#3a5bd0", "#1d2e74"], title: "¿Quién Soy?", desc: "Adivina al jugador por sus pistas: club, país, posición y palmarés.", tags: ["1 jugador", "Pistas"] },
  { id: "g2", ic: "ic-bolt", gradient: ["#d04a2a", "#7a1f12"], title: "Reacción Rápida", desc: "60 segundos. Responde el máximo de preguntas antes de que caiga el tiempo.", tags: ["Contrarreloj", "60s"] },
  { id: "g3", ic: "ic-eleven", gradient: ["#1e8a4d", "#0f4d2c"], title: "Arma el Once", desc: "Reconstruye la alineación titular de un equipo histórico.", tags: ["Memoria", "Táctica"] },
  { id: "g4", ic: "ic-cup", gradient: ["#c9a341", "#7a5e1c"], title: "Palmarés", desc: "¿En qué año y con qué club? Ordena los títulos en la línea de tiempo.", tags: ["Historia", "Orden"] },
  { id: "g5", ic: "ic-shield", gradient: ["#8a3ad0", "#4a1d74"], title: "Escudos", desc: "Identifica el club por su escudo. De los gigantes a las joyas ocultas.", tags: ["Visual", "Clubes"] },
];

export interface DifficultyLevel {
  key: string;
  name: string;
  label: string;
}

export const LEVELS: DifficultyLevel[] = [
  { key: "l1", name: "Canterano", label: "FÁCIL" },
  { key: "l2", name: "Titular", label: "MEDIO" },
  { key: "l3", name: "Leyenda", label: "DIFÍCIL" },
];

/** Desafío Individual minigames (same games, lighter copy). */
export const CHALLENGE_GAMES: Pick<MiniGame, "id" | "ic" | "gradient" | "title">[] = [
  { id: "g1", ic: "ic-question", gradient: ["#3a5bd0", "#1d2e74"], title: "¿Quién Soy?" },
  { id: "g2", ic: "ic-bolt", gradient: ["#d04a2a", "#7a1f12"], title: "Reacción Rápida" },
  { id: "g3", ic: "ic-eleven", gradient: ["#1e8a4d", "#0f4d2c"], title: "Arma el Once" },
  { id: "g4", ic: "ic-cup", gradient: ["#c9a341", "#7a5e1c"], title: "Palmarés" },
  { id: "g5", ic: "ic-shield", gradient: ["#8a3ad0", "#4a1d74"], title: "Escudos" },
];

/** Per-game streak progress (mock save). */
export interface ChallengeStreak {
  /** Canterano streak (0–3). */
  can: number;
  /** Titular streak (0–3). */
  tit: number;
  /** Leyenda streak (0–3). */
  ley: number;
  /** Whether today's timed run is already done. */
  today: boolean;
  best: number;
  desc: string;
}

export const STREAKS: Record<string, ChallengeStreak> = {
  g1: { can: 3, tit: 1, ley: 0, today: false, best: 7, desc: "Adivina al jugador por sus pistas antes de quedarte sin intentos." },
  g2: { can: 3, tit: 3, ley: 1, today: true, best: 12, desc: "Responde el máximo de preguntas posibles contra el cronómetro." },
  g3: { can: 2, tit: 0, ley: 0, today: false, best: 4, desc: "Reconstruye de memoria la alineación titular de un equipo histórico." },
  g4: { can: 3, tit: 0, ley: 0, today: false, best: 6, desc: "Ordena los títulos de un club en la línea de tiempo correcta." },
  g5: { can: 1, tit: 0, ley: 0, today: true, best: 3, desc: "Identifica clubes por su escudo, de los gigantes a las joyas ocultas." },
};

/** Active timed difficulty given a streak (advances once a tier hits 3). */
export function activeTimerLevel(s: ChallengeStreak): string {
  return s.can < 3 ? "Canterano" : s.tit < 3 ? "Titular" : "Leyenda";
}

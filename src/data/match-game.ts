/** Shared rules/constants of the "Once Mundialista" minigame. Client-safe
 * (plain data) and imported by the server actions as the single source of
 * truth for timing windows and cell→position validation. */

/** 3 → 2 → 1 → ¡A JUGAR! intro, derived from the room's startedAt. */
export const COUNTDOWN_MS = 4_000;
/** Host-selectable match durations (seconds); 0 = no time limit. */
export const DURATION_OPTIONS = [60, 120, 240, 0] as const;
export const DEFAULT_DURATION_S = 120;
/** Nation-change penalty: claims blocked, next nation hidden until it ends. */
export const PENALTY_MS = 5_000;
/** Server-side grace after the buzzer so in-flight claims still land. */
export const CLAIM_GRACE_MS = 1_500;
/** Goals from which a lead can become mathematically unreachable (22 cells). */
export const EARLY_FINISH_MIN = 12;

/** FIFA-ranking deck size per room difficulty (host's pick on /amistoso). */
export const DIFFICULTY_TOP: Record<string, number> = {
  "Fácil": 15, // Canterano
  "Medio": 30, // Titular
  "Difícil": 50, // Leyenda
};
export const DEFAULT_TOP = 30;

/** Player-facing names of the stored difficulty values. */
export const DIFFICULTY_LABELS: Record<string, string> = {
  "Fácil": "Canterano",
  "Medio": "Titular",
  "Difícil": "Leyenda",
};

/** Accepted players.sub_position values per board cell label. */
export const POS_SUBPOSITIONS: Record<string, string[]> = {
  POR: ["Goalkeeper"],
  LD: ["Right-Back"],
  DFC: ["Centre-Back"],
  LI: ["Left-Back"],
  MCD: ["Defensive Midfield", "Central Midfield"],
  MO: ["Attacking Midfield"],
  ED: ["Right Winger", "Right Midfield"],
  EI: ["Left Winger", "Left Midfield"],
  DC: ["Centre-Forward", "Second Striker"],
};

/** True when the leader's advantage can no longer be tied (strict: a reachable
 * draw — other + free === leader — keeps the match alive). */
export const isLeadUnreachable = (leader: number, other: number, freeCells: number) =>
  leader >= EARLY_FINISH_MIN && other + freeCells < leader;

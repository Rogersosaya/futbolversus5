/** Shared rules/constants of the "Once Mundialista" minigame. Client-safe
 * (plain data) and imported by the server actions as the single source of
 * truth for timing windows and cell→position validation. */

/** Each countdown number (3, 2, 1) is held this long before the next. */
export const COUNTDOWN_STEP_MS = 2_000;
/** 3 → 2 → 1 intro window (then ¡A JUGAR! / kickoff), derived from startedAt.
 * Three numbers × COUNTDOWN_STEP_MS. */
export const COUNTDOWN_MS = 3 * COUNTDOWN_STEP_MS;
/** Host-selectable match durations (seconds); 0 = no time limit. */
export const DURATION_OPTIONS = [60, 120, 240, 0] as const;
export const DEFAULT_DURATION_S = 120;
/** Nation-change penalty: claims blocked, next nation hidden until it ends. */
export const PENALTY_MS = 5_000;
/** Server-side grace after the buzzer so in-flight claims still land. */
export const CLAIM_GRACE_MS = 1_500;
/** Goals from which a lead can become mathematically unreachable (22 cells). */
export const EARLY_FINISH_MIN = 12;

// Difficulty labels and the FIFA-ranking deck size per difficulty now live in
// the per-game registry: see src/data/game-difficulties.ts (nationDeckTop,
// difficultyLabel). Each game owns its own difficulties and rules there.

/** Accepted players.main_position values per board cell label. */
export const POS_MAIN_POSITIONS: Record<string, string[]> = {
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

/** Full position name shown on the board / search for each cell label
 * (replaces the Spanish abbreviations POR, MCD, MO… in the UI). */
export const POS_FULL_LABELS: Record<string, string> = {
  POR: "Goalkeeper",
  LD: "Right-Back",
  DFC: "Centre-Back",
  LI: "Left-Back",
  MCD: "Defensive Midfield",
  MO: "Attacking Midfield",
  ED: "Right Winger",
  EI: "Left Winger",
  DC: "Centre-Forward",
};

/** True when the leader's advantage can no longer be tied (strict: a reachable
 * draw — other + free === leader — keeps the match alive). */
export const isLeadUnreachable = (leader: number, other: number, freeCells: number) =>
  leader >= EARLY_FINISH_MIN && other + freeCells < leader;

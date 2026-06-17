// Shared, deterministic match-entry timeline (client-safe, no secrets).
//
// The single source of truth for the whole "match found → entering the
// stadium → 3·2·1 → game room" sequence is the room row in Postgres: its
// server-side `ready_at` timestamp anchors the timeline. Both clients compute
// `elapsed = (Date.now() + clockSkew) - readyAt` and render whatever beat that
// elapsed time falls in, so the choreography stays synchronized across
// players, survives refreshes (a reload resumes mid-beat instead of
// restarting) and tolerates latency differences — nobody waits on anybody
// else's local state.
//
// Split of responsibilities:
//  • LOBBY  → plays ONLY the stadium-entry cinematic [readyAt, readyAt+ENTRY_MS),
//             then navigates to the game room (covered, so the bare lobby never
//             flashes).
//  • ARENA  → shows the 3·2·1 countdown OVER the game board and then the live
//             game. Its countdown anchor `started_at` = readyAt + ENTRY_MS +
//             HANDOFF_MS, so it's still in the FUTURE when the arena mounts —
//             the board renders first, then the "3" appears in full over it,
//             never truncated and never overlapping the lobby's entry.

/** The lobby's only beat: the stadium-entry cinematic (tunnel → pitch). */
export const ENTRY_MS = 3800;

/** Cushion between the lobby→arena navigation and the countdown start, so the
 * arena is mounted (board visible) before "3" shows. */
export const HANDOFF_MS = 1000;

/** Elapsed time (from readyAt) at which the lobby hands off to the game room —
 * i.e. the entry cinematic is over. The countdown then runs in the arena. */
export const TIMELINE_TOTAL_MS = ENTRY_MS;

export type MatchPhase = "entry" | "done";

/** Whether the lobby's entry cinematic already elapsed for a given anchor
 * (i.e. the player belongs in the game room now). */
export function timelineDone(readyAt: Date | number | null): boolean {
  if (readyAt == null) return false;
  const anchor = typeof readyAt === "number" ? readyAt : readyAt.getTime();
  return Date.now() - anchor >= TIMELINE_TOTAL_MS;
}

/** The lobby beat a given elapsed-since-readyAt falls in. */
export function phaseAt(elapsedMs: number): MatchPhase {
  return elapsedMs < ENTRY_MS ? "entry" : "done";
}

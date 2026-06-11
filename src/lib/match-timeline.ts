// Shared, deterministic match-entry timeline (client-safe, no secrets).
//
// The single source of truth for the whole "match found → entering the
// stadium → game room" sequence is the room row in Postgres: its server-side
// `ready_at` timestamp anchors the timeline. Both clients compute
// `elapsed = (Date.now() + clockSkew) - readyAt` and render whatever beat that
// elapsed time falls in, so the choreography stays synchronized across
// players, survives refreshes (a reload resumes mid-beat instead of
// restarting) and tolerates latency differences — nobody waits on anybody
// else's local state.

/** Beat 1 — the VS slam (match found). */
export const SLAM_MS = 1100;
/** Beat 2 — hold on the matched rival while "entering" is announced. */
export const HOLD_MS = 1000;
/** Beat 3 — stadium-entry cinematic (tunnel → floodlights → pitch). */
export const ENTRY_MS = 3800;
/** Elapsed time (from readyAt) at which clients navigate to the game room. */
export const TIMELINE_TOTAL_MS = SLAM_MS + HOLD_MS + ENTRY_MS;

export type MatchPhase = "slam" | "hold" | "entry" | "done";

/** Whether the full entry timeline already elapsed for a given anchor. */
export function timelineDone(readyAt: Date | number | null): boolean {
  if (readyAt == null) return false;
  const anchor = typeof readyAt === "number" ? readyAt : readyAt.getTime();
  return Date.now() - anchor >= TIMELINE_TOTAL_MS;
}

/** The beat a given elapsed-since-readyAt falls in. */
export function phaseAt(elapsedMs: number): MatchPhase {
  if (elapsedMs < SLAM_MS) return "slam";
  if (elapsedMs < SLAM_MS + HOLD_MS) return "hold";
  if (elapsedMs < TIMELINE_TOTAL_MS) return "entry";
  return "done";
}

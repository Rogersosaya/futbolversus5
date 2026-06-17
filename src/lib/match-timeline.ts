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
//
// The pre-kickoff sequence is intentionally minimal: there is no "opponent
// found" flourish. The lobby plays exactly ONE beat — the stadium-entry
// cinematic — and then navigates to the game room, where the synchronized
// 3·2·1 countdown runs. The game room's `started_at` is stamped
// deterministically as `readyAt + ENTRY_MS + HANDOFF_MS`, so both players share
// the exact same countdown window regardless of who navigates first.

/** The only pre-kickoff beat: the stadium-entry cinematic (tunnel →
 * floodlights → pitch). Anchored at `readyAt`. */
export const ENTRY_MS = 3800;

/** Lobby → game-room handoff cushion. The lobby navigates at
 * `readyAt + ENTRY_MS`; the countdown anchor (`started_at`) is pushed
 * `HANDOFF_MS` further out so it is still in the FUTURE when each client mounts
 * the arena — guaranteeing the "3" is shown in full and never truncated by a
 * slow navigation/mount. */
export const HANDOFF_MS = 650;

/** Elapsed time (from readyAt) at which clients navigate to the game room. */
export const TIMELINE_TOTAL_MS = ENTRY_MS;

export type MatchPhase = "entry" | "done";

/** Whether the full entry timeline already elapsed for a given anchor. */
export function timelineDone(readyAt: Date | number | null): boolean {
  if (readyAt == null) return false;
  const anchor = typeof readyAt === "number" ? readyAt : readyAt.getTime();
  return Date.now() - anchor >= TIMELINE_TOTAL_MS;
}

/** The beat a given elapsed-since-readyAt falls in. */
export function phaseAt(elapsedMs: number): MatchPhase {
  return elapsedMs < ENTRY_MS ? "entry" : "done";
}

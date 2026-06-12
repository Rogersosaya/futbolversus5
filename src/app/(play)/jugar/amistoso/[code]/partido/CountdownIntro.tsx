"use client";

/**
 * Synchronized kickoff countdown: 3 → 2 → 1 → ¡A JUGAR!. Purely presentational
 * — the tick index is derived upstream from the room's shared startedAt anchor
 * (server clock), so both players see the exact same beat and a reload resumes
 * mid-sequence at the right number.
 */
export function CountdownIntro({ tick }: { tick: number }) {
  const label = tick >= 3 ? "¡A JUGAR!" : String(3 - tick);
  return (
    <div className="ko-intro" aria-hidden>
      <div className="ko-flash" key={`f${tick}`} />
      <div className={`ko-num${tick >= 3 ? " go" : ""}`} key={tick}>
        {label}
      </div>
    </div>
  );
}

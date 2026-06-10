"use client";

import type { CSSProperties } from "react";

/** Five-star bar filled to `rating`% (rating is a 0–100 power value). */
export function Stars({ rating }: { rating: number }) {
  return (
    <div className="stars" style={{ "--r": `${rating * 0.9}%` } as CSSProperties}>
      <span className="base">★★★★★</span>
      <span className="fill">★★★★★</span>
    </div>
  );
}

/** The NIVEL / PODER / VICT. stat row under a team card. */
export function StatRow({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="stats">
      {stats.map((s) => (
        <div className="stat" key={s.label}>
          <span className="lab">{s.label}</span>
          <span className="val">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { CollectibleGlyph } from "@/components/CollectibleArt";
import { ShieldArt } from "@/components/game-art";
import type { SelfMatchCard } from "@/actions/friends";

const COPY = {
  win: { tag: "PARTIDO FINALIZADO", title: "VICTORIA", mood: "win" },
  lose: { tag: "PARTIDO FINALIZADO", title: "DERROTA", mood: "lose" },
  draw: { tag: "PARTIDO FINALIZADO", title: "EMPATE", mood: "draw" },
} as const;

/** Full-screen result overlay once the room is FINISHED. */
export function ResultScreen({
  result,
  myScore,
  rivalScore,
  me,
  rival,
  onExit,
}: {
  result: "win" | "lose" | "draw";
  myScore: number;
  rivalScore: number;
  me: SelfMatchCard;
  rival: SelfMatchCard;
  onExit: () => void;
}) {
  const c = COPY[result];
  return (
    <div className={`match-result ${c.mood}`}>
      <span className="ctx-tag">{c.tag}</span>
      <div className="mr-title">{c.title}</div>
      <div className="mr-score">
        <div className="mr-side">
          <span className="mr-cr">
            {me.art ? <CollectibleGlyph c={me.art} /> : <ShieldArt id={null} />}
          </span>
          <span className="mr-club">{me.club}</span>
        </div>
        <b className="mr-num">{myScore}</b>
        <span className="mr-dash">–</span>
        <b className="mr-num">{rivalScore}</b>
        <div className="mr-side away">
          <span className="mr-cr">
            {rival.art ? <CollectibleGlyph c={rival.art} /> : <ShieldArt id={null} />}
          </span>
          <span className="mr-club">{rival.club}</span>
        </div>
      </div>
      <button className="mr-btn" onClick={onExit}>
        VOLVER A AMISTOSOS
      </button>
    </div>
  );
}

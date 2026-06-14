"use client";

import { useState } from "react";

import { CollectibleGlyph } from "@/components/CollectibleArt";
import { ShieldArt } from "@/components/game-art";
import { Sym } from "@/components/svg";
import type { SelfMatchCard } from "@/actions/friends";

const COPY = {
  win: { tag: "PARTIDO FINALIZADO", title: "VICTORIA", mood: "win" },
  lose: { tag: "PARTIDO FINALIZADO", title: "DERROTA", mood: "lose" },
  draw: { tag: "PARTIDO FINALIZADO", title: "EMPATE", mood: "draw" },
} as const;

/** The one rematch button cycles through the handshake states. */
function RematchButton({
  myRematch,
  rivalRematch,
  rematchAgreed,
  rivalName,
  onRematch,
}: {
  myRematch: boolean;
  rivalRematch: boolean;
  rematchAgreed: boolean;
  rivalName: string;
  onRematch: () => Promise<void>;
}) {
  const [sending, setSending] = useState(false);

  if (rematchAgreed || (myRematch && rivalRematch)) {
    return (
      <button className="mr-rematch waiting" disabled>
        <Sym id="ic-refresh" />
        ¡REVANCHA! ENTRANDO…
      </button>
    );
  }
  if (myRematch) {
    return (
      <button className="mr-rematch waiting" disabled>
        <Sym id="ic-refresh" />
        ESPERANDO AL RIVAL…
      </button>
    );
  }
  const ask = async () => {
    setSending(true);
    try {
      await onRematch();
    } finally {
      setSending(false);
    }
  };
  if (rivalRematch) {
    return (
      <button className="mr-rematch incoming" disabled={sending} onClick={ask}>
        <Sym id="ic-refresh" />
        ¡{rivalName.toUpperCase()} QUIERE REVANCHA! — ACEPTAR
      </button>
    );
  }
  return (
    <button className="mr-rematch" disabled={sending} onClick={ask}>
      <Sym id="ic-refresh" />
      REVANCHA
    </button>
  );
}

/** Full-screen result overlay once the room is FINISHED. */
export function ResultScreen({
  result,
  myScore,
  rivalScore,
  me,
  rival,
  myRematch,
  rivalRematch,
  rematchAgreed,
  onRematch,
  onExit,
}: {
  result: "win" | "lose" | "draw";
  myScore: number;
  rivalScore: number;
  me: SelfMatchCard;
  rival: SelfMatchCard;
  myRematch: boolean;
  rivalRematch: boolean;
  rematchAgreed: boolean;
  onRematch: () => Promise<void>;
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
      <div className="mr-actions">
        <RematchButton
          myRematch={myRematch}
          rivalRematch={rivalRematch}
          rematchAgreed={rematchAgreed}
          rivalName={rival.president}
          onRematch={onRematch}
        />
        <button className="mr-btn" onClick={onExit}>
          VOLVER A AMISTOSOS
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/svg";
import { MiniGameModal } from "@/components/MiniGameModal";
import { createFriendlyRoom } from "@/app/actions/matchroom";
import { DIFFICULTY_LABELS } from "@/data/match-game";
import type { Game } from "@/generated/prisma/client";

/** Host-selectable match durations (seconds); 0 = no time limit. */
const DURATION_CHOICES: { value: number; label: string }[] = [
  { value: 60, label: "RÁPIDO · 60 s" },
  { value: 120, label: "CLÁSICO · 120 s" },
  { value: 240, label: "EXTENDIDO · 240 s" },
  { value: 0, label: "SIN LÍMITE" },
];

export function AmistosoView({ games }: { games: Game[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [durationS, setDurationS] = useState(120);
  const [isPending, startTransition] = useTransition();

  // JUGAR creates a persistent match room server-side; the action itself
  // redirects to its lobby at /jugar/amistoso/<code>.
  const play = (g: Game) => {
    startTransition(async () => {
      await createFriendlyRoom(g.id, difficulty, durationS);
    });
  };

  const game = selected !== null ? games.find((g) => g.id === selected) ?? null : null;

  const handleOpen = (g: Game) => {
    setSelected(g.id);
    setDifficulty(g.availableDifficulties[0] ?? null);
    setDurationS(120);
  };

  return (
    <div className="amistoso">
      <div className="section-head">
        <div>
          <h2>AMISTOSO</h2>
          <div className="sh-sub">Elige un minijuego y mide tu fútbol. Sin presión, solo gloria.</div>
        </div>
      </div>

      <div className="mg-grid">
        {games.map((g) => (
          <button
            key={g.id}
            className={`mg-card${selected === g.id ? " sel" : ""}`}
            onClick={() => handleOpen(g)}
          >
            <div
              className="mg-art"
              style={{ backgroundImage: `url('${g.imageUrl}')`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <div className="mg-body">
              <div className="mt">{g.name}</div>
              <div className="md">{g.description}</div>
            </div>
          </button>
        ))}
      </div>

      {game && (
        <MiniGameModal onClose={() => setSelected(null)}>
          <div className="mg-detail">
            <div
              className="dt-art"
              style={{ backgroundImage: `url('${game.imageUrl}')`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <div className="dt-body">
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              {game.availableDifficulties.length > 0 && (
                <div>
                  <div className="lvl-label">DIFICULTAD</div>
                  <div className="lvl-opts" style={{ marginTop: 12 }}>
                    {game.availableDifficulties.map((d) => (
                      <button
                        key={d}
                        className={`lvl${difficulty === d ? " on" : ""}`}
                        onClick={() => setDifficulty(d)}
                      >
                        <span className="dot" />
                        <span className="ln">{DIFFICULTY_LABELS[d] ?? d}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="lvl-label">TIEMPO</div>
                <div className="lvl-opts" style={{ marginTop: 12 }}>
                  {DURATION_CHOICES.map((d) => (
                    <button
                      key={d.value}
                      className={`lvl${durationS === d.value ? " on" : ""}`}
                      onClick={() => setDurationS(d.value)}
                    >
                      <span className="dot" />
                      <span className="ln">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="dt-foot">
                <button className="btn-play" disabled={isPending} onClick={() => play(game)}>
                  {isPending ? "CREANDO SALA…" : <>JUGAR <Icon id="arr" /></>}
                </button>
              </div>
            </div>
          </div>
        </MiniGameModal>
      )}
    </div>
  );
}

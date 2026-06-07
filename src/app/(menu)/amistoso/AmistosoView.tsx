"use client";

import { useState } from "react";

import { Icon } from "@/components/svg";
import { useOverlay } from "@/components/overlay-context";
import { MiniGameModal } from "@/components/MiniGameModal";
import type { Game } from "@/generated/prisma/client";

export function AmistosoView({ games }: { games: Game[] }) {
  const { openLobby } = useOverlay();
  const [selected, setSelected] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const game = selected !== null ? games.find((g) => g.id === selected) ?? null : null;

  const DIFFICULTY_LABELS: Record<string, string> = {
    "Fácil": "Canterano",
    "Medio": "Titular",
    "Difícil": "Leyenda",
  };

  const handleOpen = (g: Game) => {
    setSelected(g.id);
    setDifficulty(g.availableDifficulties[0] ?? null);
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
              <div className="dt-foot">
                <button className="btn-play" onClick={() => openLobby("amistoso")}>
                  JUGAR <Icon id="arr" />
                </button>
              </div>
            </div>
          </div>
        </MiniGameModal>
      )}
    </div>
  );
}

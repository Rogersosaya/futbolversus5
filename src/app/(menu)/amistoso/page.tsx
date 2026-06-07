"use client";

import { useState, type CSSProperties } from "react";

import { Icon, Sym } from "@/components/svg";
import { useOverlay } from "@/components/overlay-context";
import { GAMES, LEVELS, type MiniGame } from "@/data/minigames";

function artStyle(g: Pick<MiniGame, "gradient">): CSSProperties {
  return { background: `linear-gradient(150deg,${g.gradient[0]},${g.gradient[1]})` };
}

/** Amistoso view — pick a minigame, choose a difficulty, and play. */
export default function AmistosoPage() {
  const { openLobby } = useOverlay();
  const [selected, setSelected] = useState<string | null>(null);
  const [level, setLevel] = useState("l2");

  const cards = GAMES.map((g) => (
    <button
      key={g.id}
      className={`mg-card${selected === g.id ? " sel" : ""}`}
      onClick={() => setSelected(g.id)}
    >
      <div className="mg-art" style={artStyle(g)}>
        <span className="ic">
          <Sym id={g.ic} />
        </span>
      </div>
      <div className="mg-body">
        <div className="mt">{g.title}</div>
        <div className="md">{g.desc}</div>
        <div className="mg-tagrow">
          {g.tags.map((t) => (
            <span className="mg-tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  ));

  const head = (
    <div className="section-head">
      <div>
        <h2>AMISTOSO</h2>
        <div className="sh-sub">
          {selected
            ? "Elige un minijuego y mide tu fútbol."
            : "Elige un minijuego y mide tu fútbol. Sin presión, solo gloria."}
        </div>
      </div>
    </div>
  );

  if (!selected) {
    return (
      <div className="amistoso">
        {head}
        <div className="mg-grid">{cards}</div>
      </div>
    );
  }

  const game = GAMES.find((g) => g.id === selected)!;

  return (
    <div className="amistoso has-sel">
      {head}
      <div className="amistoso-split">
        <div className="mg-grid">{cards}</div>
        <div className="mg-detail">
          <div className="dt-art" style={artStyle(game)}>
            <span className="ic">
              <Sym id={game.ic} />
            </span>
          </div>
          <div className="dt-body">
            <h3>{game.title}</h3>
            <p>{game.desc}</p>
            <div>
              <div className="lvl-label">DIFICULTAD</div>
              <div className="lvl-opts" style={{ marginTop: 12 }}>
                {LEVELS.map((l) => (
                  <button
                    key={l.key}
                    className={`lvl ${l.key}${level === l.key ? " on" : ""}`}
                    onClick={() => setLevel(l.key)}
                  >
                    <span className="dot" />
                    <span className="ln">{l.name}</span>
                    <span className="lx">{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="dt-foot">
              <button className="btn-play" onClick={() => openLobby("amistoso")}>
                JUGAR <Icon id="arr" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

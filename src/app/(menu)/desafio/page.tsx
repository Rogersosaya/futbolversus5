"use client";

import { useState, type CSSProperties } from "react";

import { Icon, Sym } from "@/components/svg";
import { MiniGameModal } from "@/components/MiniGameModal";
import {
  CHALLENGE_GAMES,
  STREAKS,
  activeTimerLevel,
  type ChallengeStreak,
} from "@/data/minigames";

function artStyle(gradient: [string, string]): CSSProperties {
  return { background: `linear-gradient(150deg,${gradient[0]},${gradient[1]})` };
}

const LADDER_LOCK = (
  <svg className="lad-lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

function LadderNode({ name, streak, unlocked }: { name: string; streak: number; unlocked: boolean }) {
  let cls: string;
  let tag: string;
  if (!unlocked) { cls = "locked"; tag = "BLOQUEADO"; }
  else if (streak >= 3) { cls = "done"; tag = "SUPERADO"; }
  else { cls = "prog"; tag = `RACHA ${streak}/3`; }

  return (
    <div className={`lad-node ${cls}`}>
      <div className="lad-top">
        <span className="lad-name">{name}</span>
        {cls === "locked" && LADDER_LOCK}
      </div>
      <div className="lad-dots">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`rd${unlocked && i < streak ? " fill" : ""}`} />
        ))}
      </div>
      <div className="lad-tag">{tag}</div>
    </div>
  );
}

function Ladder({ s }: { s: ChallengeStreak }) {
  return (
    <div className="ladder">
      <LadderNode name="Canterano" streak={s.can} unlocked />
      <span className="lad-arrow">›</span>
      <LadderNode name="Titular" streak={s.tit} unlocked={s.can >= 3} />
      <span className="lad-arrow">›</span>
      <LadderNode name="Leyenda" streak={s.ley} unlocked={s.tit >= 3} />
    </div>
  );
}

const TRAINING_LEVELS: [string, string, string][] = [
  ["l1", "Canterano", "FÁCIL"],
  ["l2", "Titular", "MEDIO"],
  ["l3", "Leyenda", "DIFÍCIL"],
];

export default function DesafioPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"timer" | "libre">("timer");
  const [trainLevel, setTrainLevel] = useState("l1");

  const game = selected ? CHALLENGE_GAMES.find((x) => x.id === selected) ?? null : null;
  const s = selected ? STREAKS[selected] : null;
  const al = s ? activeTimerLevel(s) : null;

  return (
    <div className="amistoso">
      <div className="section-head">
        <div>
          <h2>DESAFÍO INDIVIDUAL</h2>
          <div className="sh-sub">Sin rival, solo tú contra el juego. Forja tu racha en Contrarreloj o entrena libre.</div>
        </div>
      </div>

      <div className="mg-grid">
        {CHALLENGE_GAMES.map((g) => {
          const gs = STREAKS[g.id];
          const gal = activeTimerLevel(gs);
          return (
            <button
              key={g.id}
              className={`mg-card${selected === g.id ? " sel" : ""}`}
              onClick={() => setSelected(g.id)}
            >
              <div className="mg-art" style={artStyle(g.gradient)}>
                <span className="ic"><Sym id={g.ic} /></span>
                <span className={`streak-badge${gs.today ? " done" : ""}`}>
                  {gs.today ? "HOY ✓" : `🔥 ${gal}`}
                </span>
              </div>
              <div className="mg-body">
                <div className="mt">{g.title}</div>
                <div className="mg-mini">
                  <span>Récord: <b>{gs.best}</b></span>
                  <span>Nivel: <b>{gal}</b></span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {game && s && al && (
        <MiniGameModal onClose={() => { setSelected(null); setMode("timer"); }}>
          <div className="mg-detail">
            <div className="dt-art" style={artStyle(game.gradient)}>
              <span className="ic"><Sym id={game.ic} /></span>
            </div>
            <div className="dt-body">
              <h3>{game.title}</h3>
              <p>{s.desc}</p>

              <div className="dmode">
                <button className={`dm${mode === "timer" ? " on" : ""}`} onClick={() => setMode("timer")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="13" r="8" /><path d="M12 13V9M9 2h6" />
                  </svg>
                  Contrarreloj
                </button>
                <button className={`dm${mode === "libre" ? " on" : ""}`} onClick={() => setMode("libre")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 3v18M6 14l11-3M6 5l13-2v9" />
                  </svg>
                  Entrenamiento
                </button>
              </div>

              {mode === "timer" ? (
                <>
                  <div className="dnote">
                    <b>1 intento al día.</b> Supera tu nivel 3 días seguidos para desbloquear el siguiente.
                  </div>
                  <Ladder s={s} />
                  <div className="dt-foot">
                    {s.today ? (
                      <>
                        <button className="btn-play" disabled style={{ opacity: 0.5, cursor: "default", boxShadow: "none" }}>
                          RETO DE HOY COMPLETADO
                        </button>
                        <div className="dnext">Vuelve mañana para mantener tu racha</div>
                      </>
                    ) : (
                      <button className="btn-play">
                        RETO DE HOY · {al.toUpperCase()} <Icon id="arr" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="dnote">
                    Practica <b>sin límite</b> en cualquier nivel. No afecta tus rachas ni tu récord oficial.
                  </div>
                  <div>
                    <div className="lvl-label">NIVEL DE ENTRENAMIENTO</div>
                    <div className="lvl-opts" style={{ marginTop: 12 }}>
                      {TRAINING_LEVELS.map(([k, n, x]) => (
                        <button
                          key={k}
                          className={`lvl ${k}${trainLevel === k ? " on" : ""}`}
                          onClick={() => setTrainLevel(k)}
                        >
                          <span className="dot" />
                          <span className="ln">{n}</span>
                          <span className="lx">{x}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="dt-foot">
                    <button className="btn-play">
                      ENTRENAR <Icon id="arr" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </MiniGameModal>
      )}
    </div>
  );
}

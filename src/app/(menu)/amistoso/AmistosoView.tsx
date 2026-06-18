"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Icon } from "@/components/svg";
import { MiniGameModal } from "@/components/MiniGameModal";
import { createFriendlyRoom } from "@/app/actions/matchroom";
import { getDifficulty, type GameDifficulty } from "@/data/game-difficulties";
import type { Game } from "@/generated/prisma/client";

/** Host-selectable match durations (seconds); 0 = no time limit. */
const DURATION_CHOICES: { value: number; label: string }[] = [
  { value: 60, label: "60 SEGUNDOS" },
  { value: 120, label: "120 SEGUNDOS" },
  { value: 240, label: "240 SEGUNDOS" },
  { value: 0, label: "SIN LÍMITE" },
];

/** One difficulty option: a selectable row plus an info icon that reveals the
 * difficulty's rules in a floating tooltip (on hover/focus and on tap). */
function DifficultyOption({
  info,
  selected,
  onSelect,
}: {
  info: GameDifficulty;
  selected: boolean;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const helpRef = useRef<HTMLSpanElement>(null);

  // Close a tapped-open tooltip when interacting elsewhere (touch devices,
  // where there is no mouseleave to dismiss it).
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!helpRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div
      className={`lvl${selected ? " on" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="dot" />
      <span className="ln">{info.label}</span>
      <span
        ref={helpRef}
        className="lvl-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          className="lvl-i"
          aria-label={`Cómo funciona ${info.label}`}
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <Icon id="info" />
        </button>
        <span className="lvl-tip" role="tooltip" hidden={!open}>
          {info.description}
        </span>
      </span>
    </div>
  );
}

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
                    {game.availableDifficulties.map((d) => {
                      const info =
                        getDifficulty(game.id, d) ?? { key: d, label: d, description: "" };
                      return (
                        <DifficultyOption
                          key={d}
                          info={info}
                          selected={difficulty === d}
                          onSelect={() => setDifficulty(d)}
                        />
                      );
                    })}
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

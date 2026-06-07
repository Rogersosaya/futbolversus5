"use client";

import { useState, type CSSProperties } from "react";

import { CrestArt, FlagSvg, Sym } from "@/components/svg";
import { useOverlay, type GameMode } from "@/components/overlay-context";
import {
  ACTIVE_COUNTRY,
  BOARD_CELLS,
  BOARD_FILL,
  GAME_ME,
  GAME_OPP,
  SELECTED_CELL,
  SELECTED_FILL,
  type BoardCell,
  type BoardSide,
} from "@/data/gameboard";

/** Whose turn it is, or who just scored. */
type Scenario = "select" | "mine" | "rival";

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 21l4-1 11-11-3-3L4 17z" />
    <path d="M14 6l3 3" />
  </svg>
);

const Silhouette = () => (
  <span className="sil">
    <Sym id="ic-silhouette" viewBox="0 0 64 64" />
  </span>
);

function ownerStyle(side: BoardSide): CSSProperties {
  return { "--own": side.own, "--own-glow": side.glow } as CSSProperties;
}

function Token({ cell, scenario }: { cell: BoardCell; scenario: Scenario }) {
  const pos: CSSProperties = { left: `${cell.x}%`, top: `${cell.y}%` };

  // The selected cell, once a side scores, shows the freshly placed player.
  if (cell.id === SELECTED_CELL && scenario !== "select") {
    const win = scenario === "mine";
    const player = win ? SELECTED_FILL.mine : SELECTED_FILL.rival;
    const side = win ? GAME_ME : GAME_OPP;
    return (
      <div className={`tok fill just${win ? " mine" : ""}`} style={{ ...pos, ...ownerStyle(side) }}>
        <div className="disc">
          <div className="photo">
            <Silhouette />
          </div>
          <span className="fl">
            <FlagSvg code={player.flag} />
          </span>
        </div>
        <span className="nm">{player.name}</span>
      </div>
    );
  }

  if (cell.id === SELECTED_CELL) {
    return (
      <div className="tok empty sel" style={pos}>
        <div className="disc">
          <span className="pos">{cell.pos}</span>
        </div>
        <span className="nm">TU CASILLA</span>
      </div>
    );
  }

  const filled = BOARD_FILL[cell.id];
  if (filled) {
    const side = filled.by === "me" ? GAME_ME : GAME_OPP;
    return (
      <div
        className={`tok fill${filled.by === "me" ? " mine" : ""}`}
        style={{ ...pos, ...ownerStyle(side) }}
      >
        <div className="disc">
          <div className="photo">
            {filled.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={filled.photo} alt="" />
            ) : (
              <Silhouette />
            )}
          </div>
          <span className="fl">
            <FlagSvg code={filled.flag} />
          </span>
        </div>
        <span className="nm">{filled.name}</span>
      </div>
    );
  }

  return (
    <div className="tok empty" style={pos}>
      <div className="disc">
        <span className="pos">{cell.pos}</span>
      </div>
    </div>
  );
}

function score(scenario: Scenario): [number, number] {
  let me = 0;
  let op = 0;
  Object.values(BOARD_FILL).forEach((f) => (f.by === "me" ? me++ : op++));
  if (scenario === "mine") me++;
  if (scenario === "rival") op++;
  return [me, op];
}

export function GameOverlay({ mode }: { mode: GameMode }) {
  const { close } = useOverlay();
  const [scenario, setScenario] = useState<Scenario>("select");
  const [scoreMe, scoreOp] = score(scenario);

  const renderControl = () => {
    if (scenario === "select") {
      return (
        <div className="gc-input">
          <EditIcon />
          <input placeholder={`Escribe un jugador de ${ACTIVE_COUNTRY.name}…`} defaultValue="Cu" />
          <span className="caret" />
        </div>
      );
    }
    const win = scenario === "mine";
    const side = win ? GAME_ME : GAME_OPP;
    const who = win ? "TÚ" : "Lucía_10";
    const name = win ? SELECTED_FILL.mine.name : SELECTED_FILL.rival.name;
    return (
      <div
        className="gc-input"
        style={{ borderColor: side.own, boxShadow: `0 0 0 4px ${side.glow.replace(".75", ".14")}` }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke={side.own} strokeWidth="2.4">
          <path d="M5 12l5 5 9-11" />
        </svg>
        <input value={`${name} · ${who} anota`} readOnly style={{ color: side.own, fontWeight: 700 }} />
      </div>
    );
  };

  return (
    <div className="game-layer on">
      <div className="game">
        <div className="game-bg">
          <div className="crowd" />
        </div>

        <button className="game-exit" onClick={close}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>{" "}
          Salir
        </button>

        <div className="game-state">
          {(["select", "mine", "rival"] as Scenario[]).map((s) => (
            <button
              key={s}
              className={`gss${scenario === s ? " on" : ""}`}
              onClick={() => setScenario(s)}
            >
              {s === "select" ? "Tu turno" : s === "mine" ? "Tú anotas" : "Rival anota"}
            </button>
          ))}
        </div>

        <div className="gscore">
          <div className="gs-team home">
            <span className="gs-cr">
              <CrestArt crest={GAME_ME.crest} fontSize={38} />
            </span>
            <div className="gs-id">
              <span className="gs-nm">{GAME_ME.name}</span>
              <span className="gs-pr">{GAME_ME.president}</span>
            </div>
            <span className="gs-bar" style={{ background: GAME_ME.own, boxShadow: `0 0 10px ${GAME_ME.glow}` }} />
          </div>
          <div className="gs-num">
            <b>{scoreMe}</b>
          </div>
          <div className="gs-mid">
            <span className="gs-time">06:14</span>
            <span className="gs-half">
              <span className="lv" />
              1.ª PARTE
            </span>
          </div>
          <div className="gs-num">
            <b>{scoreOp}</b>
          </div>
          <div className="gs-team away">
            <span className="gs-cr">
              <CrestArt crest={GAME_OPP.crest} fontSize={38} />
            </span>
            <div className="gs-id">
              <span className="gs-nm">{GAME_OPP.name}</span>
              <span className="gs-pr">{GAME_OPP.president}</span>
            </div>
            <span className="gs-bar" style={{ background: GAME_OPP.own, boxShadow: `0 0 10px ${GAME_OPP.glow}` }} />
          </div>
        </div>

        <div className="gctrl">
          <div className="gc-prog">
            <span className="gp-n">
              13<span>/22</span>
            </span>
            <span className="gp-l">PAÍSES</span>
          </div>
          <div className="gc-country">
            <span className="gc-flag">
              <FlagSvg code={ACTIVE_COUNTRY.flag} />
            </span>
            <span className="gc-ctx">
              <small>PAÍS EN JUEGO</small>
              <b>{ACTIVE_COUNTRY.name}</b>
            </span>
          </div>
          {renderControl()}
          <button className="gc-change">
            <span className="cc-t">
              <Sym id="ic-refresh" />
              CAMBIAR
            </span>
            <span className="cc-pen">−5 s</span>
          </button>
        </div>

        <div className="ghint">
          <span className="k">1</span> Elige una casilla libre <span className="k">2</span> nómbrala con un
          jugador de {ACTIVE_COUNTRY.name}
        </div>

        <div className="gpitch-wrap">
          <div className="gpitch">
            <span className="pln mid-v" />
            <span className="pln circle" />
            <span className="pln spot" />
            <span className="pln pbox l" />
            <span className="pln pbox r" />
            <span className="pln pbox s l" />
            <span className="pln pbox s r" />
            <span className="pln pgoal l" />
            <span className="pln pgoal r" />
            <div className="gp-owner me" style={ownerStyle(GAME_ME)}>
              <i style={{ background: GAME_ME.own }} />
              <span>TÚ</span>
              <small>{GAME_ME.name}</small>
            </div>
            <div className="gp-owner op" style={ownerStyle(GAME_OPP)}>
              <i style={{ background: GAME_OPP.own }} />
              <span>RIVAL</span>
              <small>{GAME_OPP.name}</small>
            </div>
            {BOARD_CELLS.map((cell) => (
              <Token key={cell.id} cell={cell} scenario={scenario} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

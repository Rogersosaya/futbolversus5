"use client";

import { useEffect, useRef, useState } from "react";

import { CrestArt, FlagSvg, Icon } from "@/components/svg";
import { Stars, StatRow } from "@/components/lobby/parts";
import { useOverlay, type GameMode } from "@/components/overlay-context";
import {
  FRIENDS,
  FRIEND_STATUS_LABEL,
  INVITE_CODE,
  LOBBY_ME,
  LOBBY_OPP_AMIS,
  LOBBY_OPP_LIGA,
  type LobbyTeam,
} from "@/data/lobby";

/** liga: searching → rival found · amistoso: invite → rival ready */
type MatchState = "search" | "found" | "invite" | "ready";

const BackArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

function TeamCard({ team, incoming }: { team: LobbyTeam; incoming?: boolean }) {
  return (
    <div className={`team lb-team${incoming ? " in" : ""}`}>
      <div className="country-bar">
        <span className="cn">{team.country}</span>
        <span className="flag">
          <FlagSvg code={team.flag} />
        </span>
      </div>
      <div className="team-card">
        <div className="pres-chip">
          {team.avatar.kind === "image" ? (
            <span className="pc-av">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={team.avatar.src} alt="" />
            </span>
          ) : (
            <span className="pc-av txt" style={{ background: team.avatar.color }}>
              {team.avatar.text}
            </span>
          )}
          <span className="pc-tx">
            <small>PRESIDENTE</small>
            <b>{team.president}</b>
          </span>
        </div>
        <div className="team-name">{team.club}</div>
        <div className="crest-row">
          <span className="crest">
            <CrestArt crest={team.crest} fontSize={38} />
          </span>
        </div>
        <Stars rating={team.rating} />
        <StatRow stats={team.stats} />
      </div>
    </div>
  );
}

function SearchingCard() {
  return (
    <div className="team lb-team">
      <div className="country-bar dim">
        <span className="cn">Esperando rival…</span>
      </div>
      <div className="team-card searching">
        <div className="scan">
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="ring r3" />
          <span className="sweep" />
          <span className="qmark">?</span>
        </div>
        <div className="search-tx">Emparejando por valor de mercado</div>
        <div className="search-q">
          <span className="qdot" />
          128 presidentes en cola
        </div>
      </div>
    </div>
  );
}

function InviteCard({ onInvite }: { onInvite: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="invite">
      <div className="inv-block">
        <div className="inv-label">ENLACE DE INVITACIÓN</div>
        <div className="inv-link">
          <span className="il-txt">
            versus.gg/inv/<b>{INVITE_CODE}</b>
          </span>
          <button className={`il-copy${copied ? " done" : ""}`} onClick={() => setCopied(true)}>
            {copied ? "✓ COPIADO" : (<><CopyIcon />COPIAR</>)}
          </button>
        </div>
      </div>
      <div className="inv-or">
        <span>O INVITA A UN AMIGO</span>
      </div>
      <div className="friends">
        {FRIENDS.map((f) => (
          <div className="friend" key={f.name}>
            <span className="fr-av" style={{ background: f.color }}>
              {f.initial}
            </span>
            <span className="fr-tx">
              <b>{f.name}</b>
              <small>{f.club}</small>
            </span>
            <span className={`fr-st ${f.status}`}>{FRIEND_STATUS_LABEL[f.status]}</span>
            <button className="fr-inv" disabled={f.status === "off"} onClick={onInvite}>
              INVITAR
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LobbyOverlay({ mode }: { mode: GameMode }) {
  const { close, openGame } = useOverlay();
  const [matchState, setMatchState] = useState<MatchState>(mode === "liga" ? "search" : "invite");
  const [seconds, setSeconds] = useState(0);
  const [slam, setSlam] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [slamming, setSlamming] = useState(false);
  const slamTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const playSlam = () => {
    setSlam(true);
    setSlamming(true);
    setShaking(true);
    slamTimers.current.push(setTimeout(() => setShaking(false), 560));
    slamTimers.current.push(setTimeout(() => setSlamming(false), 780));
    slamTimers.current.push(setTimeout(() => setSlam(false), 1100));
  };

  const goFound = () => {
    setMatchState("found");
    playSlam();
  };

  // Liga search: tick the timer (elapsed since this search started) and
  // auto-find a rival after ~4.2s.
  useEffect(() => {
    if (mode !== "liga" || matchState !== "search") return;
    const start = Date.now();
    const interval = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 250);
    const timeout = setTimeout(goFound, 4200);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, matchState]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => slamTimers.current.forEach(clearTimeout), []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const routeLabel = mode === "liga" ? "PARTIDO DE LIGA" : "AMISTOSO";
  const switcherOptions: [MatchState, string][] =
    mode === "liga"
      ? [["search", "Buscando"], ["found", "Rival encontrado"]]
      : [["invite", "Invitar"], ["ready", "Rival listo"]];

  const selectState = (next: MatchState) => {
    if (mode === "liga" && next === "found" && matchState !== "found") {
      goFound();
      return;
    }
    setMatchState(next);
  };

  const renderCenter = () => {
    if (mode === "liga" && matchState === "search") {
      return (
        <>
          <span className="ctx-tag">
            <span className="td" />
            BRASILEIRÃO · FECHA 7
          </span>
          <div className="ctx-title">
            BUSCANDO
            <br />
            RIVAL
          </div>
          <div className="lobby-timer">{`${mm}:${ss}`}</div>
          <div className="ctx-sub">Solo presidentes de tu liga actual</div>
        </>
      );
    }
    if (mode === "liga" && matchState === "found") {
      return (
        <>
          <span className="ctx-tag good">✓ RIVAL ENCONTRADO</span>
          <div className="vs-big">VS</div>
          <button className="btn-play sm" onClick={() => openGame(mode)}>
            COMENZAR <Icon id="arr" />
          </button>
          <div className="ctx-sub">Estadio Maracanã · Brasileirão</div>
        </>
      );
    }
    if (mode === "amistoso" && matchState === "invite") {
      return (
        <>
          <span className="ctx-tag">PARTIDO AMISTOSO</span>
          <div className="ctx-title">
            INVITA A
            <br />
            UN RIVAL
          </div>
          <div className="ctx-sub">Sin ranking ni valor en juego</div>
        </>
      );
    }
    return (
      <>
        <span className="ctx-tag good">✓ TODO LISTO</span>
        <div className="vs-big">VS</div>
        <button className="btn-play sm" onClick={() => openGame(mode)}>
          COMENZAR <Icon id="arr" />
        </button>
        <div className="ctx-sub">Partido amistoso</div>
      </>
    );
  };

  const renderRight = () => {
    if (mode === "liga") {
      return matchState === "search" ? <SearchingCard /> : <TeamCard team={LOBBY_OPP_LIGA} incoming />;
    }
    return matchState === "invite" ? (
      <InviteCard onInvite={() => setMatchState("ready")} />
    ) : (
      <TeamCard team={LOBBY_OPP_AMIS} incoming />
    );
  };

  return (
    <div className="lobby-layer on">
      <div
        className={`lobby ${mode} st-${matchState}${slamming ? " slamming" : ""}${shaking ? " shaking" : ""}`}
      >
        <div className="bg">
          <div className="streaks" />
          <div className="vignette" />
        </div>

        <div className="lobby-top">
          <button className="back-chip" onClick={close}>
            <BackArrowIcon /> Volver
          </button>
          <span className="route-badge">
            <Icon id={mode === "liga" ? "ball" : "whistle"} width={16} height={16} /> {routeLabel}
          </span>
          <div className="state-switch">
            {switcherOptions.map(([key, label]) => (
              <button
                key={key}
                className={`ss${matchState === key ? " on" : ""}`}
                onClick={() => selectState(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="side-label local">TÚ</div>
        <div className="side-label away">RIVAL</div>

        <div className="lobby-cols">
          <div className="lb-col">
            <TeamCard team={LOBBY_ME} />
          </div>
          <div className="lobby-center">{renderCenter()}</div>
          <div className="lb-col">{renderRight()}</div>
        </div>

        {slam && (
          <div className="vs-slam">
            <div className="slam-flash" />
            <div className="slam-gash" />
            <div className="slam-ring" />
            <div className="slam-vs">VS</div>
          </div>
        )}
      </div>
    </div>
  );
}

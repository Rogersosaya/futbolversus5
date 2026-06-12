"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

import { CollectibleGlyph } from "@/components/CollectibleArt";
import { ShieldArt } from "@/components/game-art";
import { Sym } from "@/components/svg";
import { createClient } from "@/lib/supabase-browser";
import { roomTopicFor, SYNC_EVENT } from "@/lib/realtime-topics";
import { leaveRoom } from "@/app/actions/matchroom";
import {
  changeNation,
  claimCell,
  finalizeMatch,
  finishEarly,
  getMatchGameState,
  searchPlayers,
} from "@/app/actions/match-game";
import type { ArenaData } from "@/actions/matchroom";
import type {
  ClaimErrorCode,
  MatchGameState,
  PlayerHit,
} from "@/actions/match-game";
import type { SelfMatchCard } from "@/actions/friends";
import { BOARD_CELLS } from "@/data/gameboard";
import { COUNTDOWN_MS, PENALTY_MS, isLeadUnreachable } from "@/data/match-game";

import { CountdownIntro } from "./CountdownIntro";
import { ResultScreen } from "./ResultScreen";

/** Fixed side colors: the local player is always the light side, the rival
 * the red side — mirrors the GameOverlay convention. */
const ME_SIDE = { own: "#eef1f7", glow: "rgba(238,241,247,.75)" };
const RIVAL_SIDE = { own: "#e8344f", glow: "rgba(232,52,79,.75)" };

const sideStyle = (s: { own: string; glow: string }): CSSProperties =>
  ({ "--own": s.own, "--own-glow": s.glow } as CSSProperties);

const CLAIM_ERROR_COPY: Record<ClaimErrorCode, string> = {
  WRONG_POSITION: "No juega en esa posición",
  WRONG_NATION: "¡No es de tu selección!",
  CELL_TAKEN: "¡Tu rival ganó la casilla!",
  PLAYER_USED: "Ese jugador ya está en el campo",
  PENALIZED: "Espera el cambio de selección",
  TOO_EARLY: "El partido aún no comienza",
  ENDED: "El partido terminó",
  RETRY: "Inténtalo de nuevo",
  NOT_MEMBER: "Inténtalo de nuevo",
};

const Silhouette = () => (
  <span className="sil">
    <Sym id="ic-silhouette" viewBox="0 0 64 64" />
  </span>
);

function ScoreTeam({
  player,
  side,
  away,
}: {
  player: SelfMatchCard;
  side: { own: string; glow: string };
  away?: boolean;
}) {
  // NOTE: never use bare `home`/`away` classes here — the menu shell's
  // global `.home{position:absolute;inset:0}` (home.css) hijacks them.
  return (
    <div className={`gs-team${away ? " gs-away" : ""}`}>
      <span className="gs-cr">
        {player.art ? <CollectibleGlyph c={player.art} /> : <ShieldArt id={null} />}
      </span>
      <div className="gs-id">
        <span className="gs-nm">{player.club}</span>
        <span className="gs-pr">{player.president}</span>
      </div>
      <span
        className="gs-bar"
        style={{ background: side.own, boxShadow: `0 0 10px ${side.glow}` }}
      />
    </div>
  );
}

type Phase = "countdown" | "playing" | "finished" | "closed";

/**
 * The live "Once Mundialista" game room. Server-authoritative state: every
 * snapshot/action response carries serverNow (clock skew) and the whole
 * timeline is derived from the room's shared startedAt anchor, so countdown,
 * match clock and penalties tick identically on both screens and survive
 * reloads. The rival's moves arrive via the room's Broadcast channel (sync
 * ping → snapshot refetch); my own moves apply instantly from the action
 * response.
 */
export function MatchArena({
  initial,
  initialGame,
}: {
  initial: ArenaData;
  initialGame: MatchGameState;
}) {
  const router = useRouter();
  const { room, me, rival } = initial;

  const [game, setGame] = useState<MatchGameState>(initialGame);
  const [skew, setSkew] = useState(() => initialGame.serverNow - Date.now());
  const [nowS, setNowS] = useState(() => Date.now() + (initialGame.serverNow - Date.now()));
  const [rivalPresent, setRivalPresent] = useState(true);
  const [leaving, setLeaving] = useState(false);
  /** Top-right rejection toasts explaining WHY a pick didn't count. */
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const leavingRef = useRef(false);
  /** Last full-time finalize attempt (epoch ms) — throttles the retry loop. */
  const finalizeAtRef = useRef(0);
  const toastSeqRef = useRef(0);

  const noLimit = game.durationS === 0;
  const gameStart = game.startedAt + COUNTDOWN_MS;
  /** Infinity when the host chose "sin límite" — every timer check goes dark. */
  const gameEnd = noLimit ? Infinity : gameStart + game.durationS * 1000;

  const phase: Phase =
    game.status === "CLOSED"
      ? "closed"
      : game.status === "FINISHED"
        ? "finished"
        : nowS < gameStart
          ? "countdown"
          : "playing";

  const claimsByCell = useMemo(
    () => new Map(game.claims.map((c) => [c.cellId, c])),
    [game.claims],
  );
  const penalized = game.myPenaltyUntil != null && game.myPenaltyUntil > nowS;

  // Selection only exists while actually playable — derived, so a penalty or
  // the final whistle retires it without effect-driven state juggling.
  const [rawSelectedCell, setSelectedCell] = useState<string | null>(null);
  const selectedCell =
    phase === "playing" && !penalized && rawSelectedCell != null && !claimsByCell.has(rawSelectedCell)
      ? rawSelectedCell
      : null;
  const freeCells = BOARD_CELLS.length - game.claims.length;
  const leader = Math.max(game.myScore, game.rivalScore);
  const other = Math.min(game.myScore, game.rivalScore);
  const earlyFinishAvailable =
    phase === "playing" && isLeadUnreachable(leader, other, freeCells);

  const adoptServerNow = useCallback((serverNow: number) => {
    setSkew(serverNow - Date.now());
  }, []);

  const refetch = useCallback(async () => {
    if (leavingRef.current) return;
    const fresh = await getMatchGameState(room.code);
    if (!fresh) return;
    adoptServerNow(fresh.serverNow);
    setGame(fresh);
  }, [room.code, adoptServerNow]);

  // Same room channel as the lobby: Broadcast pings → re-sync; Presence tells
  // us whether the rival's client is actually connected right now.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(roomTopicFor(room.id), {
      config: { presence: { key: me.id } },
    });
    const syncPresence = () => {
      const present = new Set(Object.keys(channel.presenceState()));
      setRivalPresent(present.has(rival.id));
    };
    channel
      .on("broadcast", { event: SYNC_EVENT }, () => refetch())
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          channel.track({ at: Date.now() });
          refetch();
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, me.id, rival.id, refetch]);

  // The shared clock: a single 250ms tick drives the countdown, the match
  // timer, the penalty ring and every phase transition. Skew-corrected, so
  // both screens beat in step with the server.
  useEffect(() => {
    if (phase === "finished" || phase === "closed") return;
    const tick = () => setNowS(Date.now() + skew);
    const t = setTimeout(tick, 0);
    const id = setInterval(tick, 250);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [phase, skew]);

  // Full time: both clients ask the server to finalize (idempotent — exactly
  // one transition runs) and pull the result. The shared clock keeps ticking
  // while the phase is "playing", so a failed attempt retries every ~2.5s.
  useEffect(() => {
    if (phase !== "playing" || nowS < gameEnd) return;
    if (Date.now() - finalizeAtRef.current < 2500) return;
    finalizeAtRef.current = Date.now();
    finalizeMatch(room.code)
      .then(() => refetch())
      .catch(() => {});
  }, [phase, nowS, gameEnd, room.code, refetch]);

  // The rival abandoned (room CLOSED elsewhere) → exit gracefully.
  useEffect(() => {
    if (phase !== "closed" || leavingRef.current) return;
    const t = setTimeout(() => router.replace("/amistoso"), 2600);
    return () => clearTimeout(t);
  }, [phase, router]);

  const pushToast = useCallback((msg: string) => {
    const id = ++toastSeqRef.current;
    setToasts((prev) => [...prev.slice(-3), { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const leave = async () => {
    leavingRef.current = true;
    setLeaving(true);
    await leaveRoom(room.code);
    router.push("/amistoso");
  };

  const exitFinished = () => {
    leavingRef.current = true;
    router.replace("/amistoso");
  };

  const onCellClick = (cellId: string) => {
    if (phase !== "playing" || penalized || claimsByCell.has(cellId)) return;
    setSelectedCell((cur) => (cur === cellId ? null : cellId));
  };

  const onClaimSuccess = useCallback(
    (res: Extract<Awaited<ReturnType<typeof claimCell>>, { ok: true }>) => {
      adoptServerNow(res.serverNow);
      setGame((prev) => ({
        ...prev,
        claims: prev.claims.some((c) => c.cellId === res.claim.cellId)
          ? prev.claims
          : [...prev.claims, res.claim],
        myScore: res.myScore,
        myNation: res.myNation,
        myNationIdx: res.myNationIdx,
      }));
      setSelectedCell(null);
    },
    [adoptServerNow],
  );

  const onChangeNation = async () => {
    if (phase !== "playing" || penalized) return;
    setSelectedCell(null);
    const res = await changeNation(room.code);
    adoptServerNow(res.serverNow);
    if (res.ok) {
      setGame((prev) => ({
        ...prev,
        myNation: res.myNation,
        myNationIdx: res.myNationIdx,
        myPenaltyUntil: res.myPenaltyUntil,
      }));
    }
  };

  const onFinishEarly = async () => {
    const res = await finishEarly(room.code);
    adoptServerNow(res.serverNow);
    await refetch();
  };

  // Match clock (plain seconds, counting DOWN) — shared server anchor,
  // identical on both ends. "Sin límite" shows ∞ and never expires.
  const remaining = noLimit ? 0 : Math.max(0, Math.ceil((gameEnd - nowS) / 1000));
  const clock = noLimit
    ? "∞"
    : String(phase === "countdown" ? game.durationS : remaining);
  const clockLabel =
    phase === "finished" ? "FINAL" : noLimit ? "SIN LÍMITE" : "SEGUNDOS";
  const countdownTick = Math.min(
    3,
    Math.max(0, Math.floor((nowS - game.startedAt) / 1000)),
  );
  const penaltyLeft = penalized
    ? Math.max(0, (game.myPenaltyUntil ?? 0) - nowS)
    : 0;

  const selectedPos = selectedCell
    ? BOARD_CELLS.find((c) => c.id === selectedCell)?.pos ?? null
    : null;

  return (
    <div className="game-layer on arena">
      <div className="game">
        <div className="game-bg">
          <div className="crowd" />
        </div>

        {phase !== "finished" && (
          <button className="game-exit" disabled={leaving} onClick={leave}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>{" "}
            Abandonar partido
          </button>
        )}

        {!rivalPresent && phase !== "closed" && phase !== "finished" && (
          <div className="conn-chip">
            <span className="cd" />
            EL RIVAL SE ESTÁ RECONECTANDO
          </div>
        )}

        {toasts.length > 0 && (
          <div className="gtoasts">
            {toasts.map((t) => (
              <div key={t.id} className="gtoast">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                <span>{t.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Broadcast-style scoreboard: club blocks at the edges, side-colored
            goal digits, and the (seconds) clock owning the center. */}
        <div className="gscore">
          <ScoreTeam player={me} side={ME_SIDE} />
          <div className="gs-num" style={sideStyle(ME_SIDE)}>
            <b>{game.myScore}</b>
          </div>
          <div className="gs-mid">
            <span
              className={`gs-time${!noLimit && phase === "playing" && remaining <= 15 ? " low" : ""}`}
            >
              {clock}
            </span>
            <span className="gs-half">
              <span className="lv" />
              {clockLabel}
            </span>
          </div>
          <div className="gs-num" style={sideStyle(RIVAL_SIDE)}>
            <b>{game.rivalScore}</b>
          </div>
          <ScoreTeam player={rival} side={RIVAL_SIDE} away />
        </div>

        {(phase === "playing" || phase === "countdown") && (
          <div className="gctrl">
            {/* Deck progress ("1/15 SELECCIONES") hidden for now per request.
            <div className="gc-prog">
              <span className="gp-n">
                {(game.cycleLength > 0 ? (game.myNationIdx % game.cycleLength) + 1 : 0)}
                <span>/{game.cycleLength}</span>
              </span>
              <span className="gp-l">SELECCIONES</span>
            </div> */}

            {penalized ? (
              <div className="gc-country pen">
                <span className="pen-ring" style={{ "--p": penaltyLeft / PENALTY_MS } as CSSProperties}>
                  <b>{Math.ceil(penaltyLeft / 1000)}</b>
                </span>
                <span className="gc-ctx">
                  <small>CAMBIANDO…</small>
                  <b className="pen-txt">PENALIDAD</b>
                </span>
              </div>
            ) : (
              <div className="gc-country">
                <span className="gc-flag">
                  {game.myNation.flagUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.myNation.flagUrl} alt="" referrerPolicy="no-referrer" />
                  ) : null}
                </span>
                <span className="gc-ctx">
                  <small>SELECCIÓN EN JUEGO</small>
                  <b>{game.myNation.name.toUpperCase()}</b>
                </span>
              </div>
            )}

            <PlayerSearch
              key={selectedCell ?? "idle"}
              code={room.code}
              cellId={selectedCell}
              posLabel={selectedPos}
              nationName={game.myNation.name}
              disabled={phase !== "playing" || penalized}
              onSuccess={onClaimSuccess}
              onServerNow={adoptServerNow}
              onReject={pushToast}
              onCellGone={(lost) => {
                if (lost) refetch();
                setSelectedCell(null);
              }}
            />

            <button
              className="gc-change"
              disabled={phase !== "playing" || penalized}
              onClick={onChangeNation}
            >
              <span className="cc-t">
                <Sym id="ic-refresh" />
                CAMBIAR
              </span>
              <span className="cc-pen">−5 s</span>
            </button>
          </div>
        )}

        {earlyFinishAvailable && (
          <button className="early-finish" onClick={onFinishEarly}>
            <Sym id="ic-whistle" viewBox="0 0 24 24" />
            VENTAJA INALCANZABLE — TERMINAR PARTIDO
          </button>
        )}

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
            <div className="gp-owner me" style={sideStyle(ME_SIDE)}>
              <i style={{ background: ME_SIDE.own }} />
              <span>TÚ</span>
              <small>{me.club}</small>
            </div>
            <div className="gp-owner op" style={sideStyle(RIVAL_SIDE)}>
              <i style={{ background: RIVAL_SIDE.own }} />
              <span>RIVAL</span>
              <small>{rival.club}</small>
            </div>
            {BOARD_CELLS.map((cell) => {
              const claim = claimsByCell.get(cell.id);
              const pos: CSSProperties = { left: `${cell.x}%`, top: `${cell.y}%` };
              if (claim) {
                const side = claim.mine ? ME_SIDE : RIVAL_SIDE;
                return (
                  <div
                    key={cell.id}
                    className={`tok fill just${claim.mine ? " mine" : ""}`}
                    style={{ ...pos, ...sideStyle(side) }}
                  >
                    <div className="disc">
                      <div className="photo">
                        {claim.playerImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={claim.playerImageUrl} alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <Silhouette />
                        )}
                      </div>
                    </div>
                    <span className="nm">{claim.playerName}</span>
                  </div>
                );
              }
              const selectable = phase === "playing" && !penalized;
              const sel = cell.id === selectedCell;
              return (
                <button
                  key={cell.id}
                  className={`tok empty${sel ? " sel" : ""}${selectable ? " free" : ""}`}
                  style={pos}
                  disabled={!selectable}
                  onClick={() => onCellClick(cell.id)}
                >
                  <div className="disc">
                    <span className="pos">{cell.pos}</span>
                  </div>
                  {sel && <span className="nm">TU CASILLA</span>}
                </button>
              );
            })}
          </div>
        </div>

        {phase === "countdown" && <CountdownIntro tick={countdownTick} />}

        {phase === "finished" && game.result && (
          <ResultScreen
            result={game.result}
            myScore={game.myScore}
            rivalScore={game.rivalScore}
            me={me}
            rival={rival}
            onExit={exitFinished}
          />
        )}

        {phase === "closed" && (
          <div className="arena-closed">
            <span className="ctx-tag">PARTIDO FINALIZADO</span>
            <div className="ctx-title">
              EL RIVAL
              <br />
              SE RETIRÓ
            </div>
            <div className="ctx-sub">Volviendo a amistosos…</div>
          </div>
        )}
      </div>
    </div>
  );
}

const SEARCH_DEBOUNCE_MS = 220;

/**
 * The claim flow: disabled until a free cell is selected, autofocused on
 * activation (the parent remounts it per selection via `key`, so state resets
 * naturally), dropdown from 3 characters (most valuable players first),
 * keyboard-navigable; picking a player submits the claim immediately —
 * a wrong pick just shakes and lets you retry (no penalty by design).
 */
function PlayerSearch({
  code,
  cellId,
  posLabel,
  nationName,
  disabled,
  onSuccess,
  onServerNow,
  onReject,
  onCellGone,
}: {
  code: string;
  cellId: string | null;
  posLabel: string | null;
  nationName: string;
  disabled: boolean;
  onSuccess: (res: Extract<Awaited<ReturnType<typeof claimCell>>, { ok: true }>) => void;
  onServerNow: (serverNow: number) => void;
  /** Surface a rejection toast explaining WHY the pick didn't count. */
  onReject: (msg: string) => void;
  /** Drop the selection; `lost` = the board moved under us (resync needed). */
  onCellGone: (lost?: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlayerHit[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  /** Only drives the input's error shake — the cause goes to the toasts. */
  const [error, setError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);

  const active = cellId != null && !disabled;

  // Spell out the cause with the actual pick so the player learns the rule.
  const rejectMessage = (code: ClaimErrorCode, player: PlayerHit): string => {
    switch (code) {
      case "WRONG_NATION":
        return `${player.name} no juega para ${nationName}`;
      case "WRONG_POSITION":
        return `${player.name} no juega de ${posLabel ?? "esa posición"}`;
      case "PLAYER_USED":
        return `${player.name} ya está en el campo, no se puede repetir`;
      default:
        return CLAIM_ERROR_COPY[code];
    }
  };

  // Debounced search with a sequence guard against out-of-order responses.
  // Short/cleared queries empty the dropdown from the change handler, so the
  // effect only ever schedules real lookups.
  useEffect(() => {
    if (!active || query.trim().length < 3) return;
    const seq = ++seqRef.current;
    const t = setTimeout(async () => {
      const found = await searchPlayers(query);
      if (seqRef.current !== seq) return;
      setHits(found);
      setHighlight(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, active]);

  const submit = async (player: PlayerHit) => {
    if (!cellId || submitting) return;
    setSubmitting(true);
    setError(false);
    const res = await claimCell(code, cellId, player.id);
    setSubmitting(false);
    onServerNow(res.serverNow);
    if (res.ok) {
      onSuccess(res);
      return;
    }
    onReject(rejectMessage(res.code, player));
    if (res.code === "CELL_TAKEN" || res.code === "ENDED") {
      // The board moved under us — the parent resyncs and drops the selection.
      onCellGone(true);
      return;
    }
    // Wrong guess: shake, keep the query, let them retry instantly.
    setError(true);
    inputRef.current?.focus();
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    setError(false);
    if (value.trim().length < 3) {
      seqRef.current++;
      setHits([]);
      setHighlight(0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits[highlight]) submit(hits[highlight]);
    } else if (e.key === "Escape") {
      if (query) onQueryChange("");
      else onCellGone();
    }
  };

  return (
    <div className="psearch">
      <div className={`gc-input${active ? "" : " off"}${error ? " err" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          disabled={!active || submitting}
          autoFocus={active}
          placeholder={
            active
              ? `${posLabel} de ${nationName}…`
              : "Elige una casilla libre del campo"
          }
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      {active && hits.length > 0 && (
        <div className="ps-drop" role="listbox">
          {hits.map((h, i) => (
            <button
              key={h.id}
              role="option"
              aria-selected={i === highlight}
              className={`ps-row${i === highlight ? " on" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => submit(h)}
              disabled={submitting}
            >
              <span className="ps-ph">
                {h.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <Silhouette />
                )}
              </span>
              <span className="ps-nm">{h.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

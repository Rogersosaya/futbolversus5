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
  requestRematch,
  searchPlayers,
} from "@/app/actions/match-game";
import type { ArenaData } from "@/actions/matchroom";
import type {
  ClaimErrorCode,
  ClaimResult,
  ClaimView,
  MatchGameState,
  PlayerHit,
} from "@/actions/match-game";
import type { SelfMatchCard } from "@/actions/friends";
import { BOARD_CELLS } from "@/data/gameboard";
import {
  COUNTDOWN_MS,
  COUNTDOWN_STEP_MS,
  PENALTY_MS,
  POS_FULL_LABELS,
  isLeadUnreachable,
} from "@/data/match-game";

import { CountdownIntro } from "./CountdownIntro";
import { ResultScreen } from "./ResultScreen";

/** Each side is themed by its club's own colors. These fallbacks only apply
 * when a club has no colors set: local = light, rival = red (the old scheme). */
const ME_FALLBACK = "#eef1f7";
const RIVAL_FALLBACK = "#e8344f";

type SideTheme = {
  /** A single legible accent (score underline, glows, owner dot halo). */
  own: string;
  /** Translucent halo derived from `own`. */
  glow: string;
  /** The club identity for bars/rings: solid color, or a 2-stop gradient when
   * the club has two colors. */
  ring: string;
};

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

/** WCAG relative luminance (0 = black, 1 = white). */
const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const toHex = (v: number) => v.toString(16).padStart(2, "0");

/** Lighten toward white by `t` (0–1) — rescues near-black accents that would
 * otherwise vanish against the dark arena. */
const mixWhite = (hex: string, t: number) => {
  const { r, g, b } = hexToRgb(hex);
  const m = (v: number) => Math.round(v + (255 - v) * t);
  return `#${toHex(m(r))}${toHex(m(g))}${toHex(m(b))}`;
};

const rgba = (hex: string, a: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const HEX_RE = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;

/** Build a side theme from a club's 1–2 colors. The ring preserves the raw club
 * colors (a gradient when there are two); the single `own` accent is the most
 * visible color, lightened if it'd disappear on the near-black arena. */
function clubTheme(colors: string[] | undefined, fallback: string): SideTheme {
  const cs = (colors ?? []).filter((c) => HEX_RE.test(c));
  if (cs.length === 0) {
    return { own: fallback, glow: rgba(fallback, 0.72), ring: fallback };
  }
  const brightest = cs.reduce((a, b) => (luminance(b) > luminance(a) ? b : a));
  const own = luminance(brightest) < 0.16 ? mixWhite(brightest, 0.55) : brightest;
  const ring =
    cs.length >= 2 ? `linear-gradient(135deg, ${cs[0]}, ${cs[1]})` : cs[0];
  return { own, glow: rgba(own, 0.72), ring };
}

const sideStyle = (t: SideTheme): CSSProperties =>
  ({ "--own": t.own, "--own-glow": t.glow, "--ring": t.ring } as CSSProperties);

/** Server-clock corrections smaller than this are ignored, so realtime
 * refetches can't jolt the countdown/match clock for sub-second skew jitter. */
const SKEW_THRESHOLD_MS = 750;

/** Max suggestions shown in the search dropdown. */
const SEARCH_LIMIT = 8;

/** Accent/case-insensitive fold so "mbappe" matches "Mbappé". */
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

type LocalPlayer = PlayerHit & { norm: string };

/** Instant, zero-network substring match over the preloaded top-players index.
 * Index order is already "most valuable first", so we keep it. */
function localSearch(index: LocalPlayer[], term: string): PlayerHit[] {
  const q = normalize(term.trim());
  if (q.length < 2) return [];
  const out: PlayerHit[] = [];
  for (const p of index) {
    if (p.norm.includes(q)) {
      out.push({ id: p.id, name: p.name, imageUrl: p.imageUrl });
      if (out.length >= SEARCH_LIMIT) break;
    }
  }
  return out;
}

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

/** Spinning ring — the "processing / validating" indicator. */
const Spinner = ({ className = "" }: { className?: string }) => (
  <svg className={`spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** Top-right notice variants: a pick being validated, the pass, or the reason
 * it failed. */
type ToastKind = "loading" | "success" | "error";

function ScoreTeam({
  player,
  theme,
  away,
}: {
  player: SelfMatchCard;
  theme: SideTheme;
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
        style={{ background: theme.ring, boxShadow: `0 0 10px ${theme.glow}` }}
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
  playerIndex,
}: {
  initial: ArenaData;
  initialGame: MatchGameState;
  /** Top players (id + name + photo) preloaded for instant local search. */
  playerIndex: PlayerHit[];
}) {
  const router = useRouter();
  const { room, me, rival } = initial;

  // Normalized once for accent-insensitive local matching (filled during the
  // pre-kickoff dead time, so the first keystroke is already instant).
  const localIndex = useMemo<LocalPlayer[]>(
    () => playerIndex.map((p) => ({ ...p, norm: normalize(p.name) })),
    [playerIndex],
  );

  // Each seat is themed by its club's colors (gradient when it has two);
  // falls back to the classic light/red scheme for clubless players.
  const meTheme = useMemo(() => clubTheme(me.clubColors, ME_FALLBACK), [me.clubColors]);
  const rivalTheme = useMemo(
    () => clubTheme(rival.clubColors, RIVAL_FALLBACK),
    [rival.clubColors],
  );

  const [game, setGame] = useState<MatchGameState>(initialGame);
  const [skew, setSkew] = useState(() => initialGame.serverNow - Date.now());
  const [nowS, setNowS] = useState(() => Date.now() + (initialGame.serverNow - Date.now()));
  const [rivalPresent, setRivalPresent] = useState(true);
  const [leaving, setLeaving] = useState(false);
  /** Optimistically placed claims (by cellId) awaiting server confirmation —
   * the token shows instantly and is reconciled/rolled back on the response. */
  const [pendingClaims, setPendingClaims] = useState<Map<string, ClaimView>>(
    () => new Map(),
  );
  /** Top-right notices: a pick being validated → its result (valid, or WHY not). */
  const [toasts, setToasts] = useState<
    { id: number; msg: string; kind: ToastKind }[]
  >([]);

  const leavingRef = useRef(false);
  /** Guards "Cambiar" against double-fire in the same tick (before the optimistic
   * penalty flips `penalized` and disables the button). */
  const changingRef = useRef(false);
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

  // Confirmed server claims win; an optimistic pending claim fills a cell only
  // while the server hasn't reported it yet — so a realtime refetch can never
  // wipe a token mid-flight, and a rival's real claim always takes precedence.
  const claimsByCell = useMemo(() => {
    const m = new Map(game.claims.map((c) => [c.cellId, c]));
    for (const [cellId, pc] of pendingClaims) if (!m.has(cellId)) m.set(cellId, pc);
    return m;
  }, [game.claims, pendingClaims]);
  const penalized = game.myPenaltyUntil != null && game.myPenaltyUntil > nowS;
  /** A pick is being validated on the server — lock the board until it resolves
   * so the user can't jump to another cell mid-validation. */
  const validating = pendingClaims.size > 0;

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
    // Only adopt meaningful corrections (reconnects, real drift). Ignoring
    // sub-threshold jitter keeps the countdown and match clock from stuttering
    // when a realtime refetch returns a slightly different serverNow.
    setSkew((prev) => {
      const next = serverNow - Date.now();
      return Math.abs(next - prev) > SKEW_THRESHOLD_MS ? next : prev;
    });
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

  // Rematch agreed → both clients follow the fresh room's code. The new match
  // page loads its own snapshot and the synchronized 3-2-1 runs from there.
  useEffect(() => {
    if (!game.rematchCode || leavingRef.current) return;
    leavingRef.current = true;
    router.replace(`/jugar/amistoso/${game.rematchCode}/partido`);
  }, [game.rematchCode, router]);

  const dismissToast = useCallback((id: number, delay: number) => {
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), delay);
  }, []);

  /** Add a notice. "loading" stays until it's resolved; the rest auto-dismiss. */
  const pushToast = useCallback(
    (msg: string, kind: ToastKind = "error") => {
      const id = ++toastSeqRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, msg, kind }]);
      if (kind !== "loading") dismissToast(id, 3500);
      return id;
    },
    [dismissToast],
  );

  /** Morph an existing notice in place (e.g. "Validando…" → "✓ válido") and
   * schedule its dismissal — so the user sees one notice change, not a stack. */
  const resolveToast = useCallback(
    (id: number, msg: string, kind: ToastKind) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, msg, kind } : t)),
      );
      dismissToast(id, 3000);
    },
    [dismissToast],
  );

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
    if (phase !== "playing" || penalized || validating || claimsByCell.has(cellId))
      return;
    setSelectedCell((cur) => (cur === cellId ? null : cellId));
  };

  const dropPending = useCallback((cellId: string) => {
    setPendingClaims((prev) => {
      if (!prev.has(cellId)) return prev;
      const m = new Map(prev);
      m.delete(cellId);
      return m;
    });
  }, []);

  /** Place the pick INSTANTLY (optimistic token), then validate on the server.
   * On success the token is confirmed; on rejection it's rolled back and the
   * reason is surfaced. Returns the raw result so the search box can shake /
   * keep the query for a fast retry. */
  const submitClaim = useCallback(
    async (cellId: string, player: PlayerHit): Promise<ClaimResult> => {
      // Optimistic: show the token instantly. The cell stays selected for now
      // (it reads as "filled" while pending, so the search deactivates) — on a
      // wrong guess we roll the token back and the selection re-activates for an
      // instant retry; only success clears it.
      setPendingClaims((prev) =>
        new Map(prev).set(cellId, {
          cellId,
          playerName: player.name,
          playerImageUrl: player.imageUrl,
          mine: true,
          pending: true,
        }),
      );

      const res = await claimCell(room.code, cellId, player.id);
      adoptServerNow(res.serverNow);
      dropPending(cellId);

      if (res.ok) {
        // Confirm: move from pending into the authoritative claims, free the cell.
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
      } else if (res.code === "CELL_TAKEN" || res.code === "ENDED") {
        // Board moved under us — resync and drop the now-invalid selection.
        setSelectedCell(null);
        refetch();
      }
      return res;
    },
    [room.code, adoptServerNow, dropPending, refetch],
  );

  const onChangeNation = async () => {
    if (phase !== "playing" || penalized || changingRef.current) return;
    changingRef.current = true;
    setSelectedCell(null);
    // Optimistic: start the penalty ring NOW so the button disables and the UI
    // reacts instantly; the server reconciles the exact window on response.
    setGame((prev) => ({
      ...prev,
      myPenaltyUntil: Date.now() + skew + PENALTY_MS,
    }));
    try {
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
    } finally {
      changingRef.current = false;
    }
  };

  const onFinishEarly = async () => {
    const res = await finishEarly(room.code);
    adoptServerNow(res.serverNow);
    await refetch();
  };

  const onRematch = async () => {
    const res = await requestRematch(room.code);
    if (!res) return;
    adoptServerNow(res.serverNow);
    setGame((prev) => ({
      ...prev,
      myRematch: res.myRematch,
      rivalRematch: res.rivalRematch,
      rematchCode: res.rematchCode,
    }));
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
    Math.max(0, Math.floor((nowS - game.startedAt) / COUNTDOWN_STEP_MS)),
  );
  const penaltyLeft = penalized
    ? Math.max(0, (game.myPenaltyUntil ?? 0) - nowS)
    : 0;

  const selectedCellPos = selectedCell
    ? BOARD_CELLS.find((c) => c.id === selectedCell)?.pos ?? null
    : null;
  const selectedPos = selectedCellPos
    ? POS_FULL_LABELS[selectedCellPos] ?? selectedCellPos
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
              <div key={t.id} className={`gtoast ${t.kind}`}>
                {t.kind === "loading" ? (
                  <Spinner />
                ) : t.kind === "success" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
                <span>{t.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Broadcast-style scoreboard: club blocks at the edges, side-colored
            goal digits, and the (seconds) clock owning the center. */}
        <div className="gscore">
          <ScoreTeam player={me} theme={meTheme} />
          <div className="gs-num" style={sideStyle(meTheme)}>
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
          <div className="gs-num" style={sideStyle(rivalTheme)}>
            <b>{game.rivalScore}</b>
          </div>
          <ScoreTeam player={rival} theme={rivalTheme} away />
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

            {/* No `key` remount on cell change: re-targeting a cell keeps the
                typed query (the dropdown closes on outside click, see PlayerSearch). */}
            <PlayerSearch
              localIndex={localIndex}
              cellId={selectedCell}
              posLabel={selectedPos}
              nationName={game.myNation.name}
              disabled={phase !== "playing" || penalized || validating}
              onSubmit={submitClaim}
              onValidating={(name) => pushToast(`Validando a ${name}…`, "loading")}
              onResolve={resolveToast}
              onCellGone={() => setSelectedCell(null)}
            />

            <button
              className="gc-change"
              disabled={phase !== "playing" || penalized || validating}
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
            <div className="gp-owner me" style={sideStyle(meTheme)}>
              <i style={{ background: meTheme.ring }} />
              <span>TÚ</span>
              <small>{me.club}</small>
            </div>
            <div className="gp-owner op" style={sideStyle(rivalTheme)}>
              <i style={{ background: rivalTheme.ring }} />
              <span>RIVAL</span>
              <small>{rival.club}</small>
            </div>
            {BOARD_CELLS.map((cell) => {
              const claim = claimsByCell.get(cell.id);
              const pos: CSSProperties = { left: `${cell.x}%`, top: `${cell.y}%` };
              if (claim) {
                const side = claim.mine ? meTheme : rivalTheme;
                return (
                  <div
                    key={cell.id}
                    className={`tok fill just${claim.mine ? " mine" : ""}${claim.pending ? " pending" : ""}`}
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
                      {claim.pending && (
                        <span className="tok-spin" aria-label="Validando">
                          <Spinner />
                        </span>
                      )}
                    </div>
                    <span className="nm">{claim.playerName}</span>
                  </div>
                );
              }
              const selectable = phase === "playing" && !penalized && !validating;
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
                    <span className="pos">{POS_FULL_LABELS[cell.pos] ?? cell.pos}</span>
                  </div>
                  {sel && <span className="nm">TU CASILLA</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* The 3·2·1 plays OVER the board (which is already rendered behind it).
            During the brief handoff (nowS < startedAt) the board simply shows on
            its own; the countdown appears once the shared anchor is reached so
            the "3" is never truncated, and it's gone the instant play begins. */}
        {phase === "countdown" && nowS >= game.startedAt && (
          <CountdownIntro tick={countdownTick} />
        )}

        {phase === "finished" && game.result && (
          <ResultScreen
            result={game.result}
            myScore={game.myScore}
            rivalScore={game.rivalScore}
            me={me}
            rival={rival}
            myRematch={game.myRematch}
            rivalRematch={game.rivalRematch}
            rematchAgreed={game.rematchCode != null}
            onRematch={onRematch}
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

/** Debounce for the SERVER fallback only — local index results are instant. */
const SEARCH_DEBOUNCE_MS = 120;

/**
 * The claim flow: disabled until a free cell is selected, autofocused on
 * activation, dropdown from 2 characters served INSTANTLY from the preloaded
 * top-players index (zero network), with a debounced server fallback only when
 * the local list isn't full (rare names). Keyboard-navigable; picking a player
 * submits an OPTIMISTIC claim (token shows at once in the parent) and a wrong
 * pick just shakes and lets you retry instantly (no penalty by design).
 */
function PlayerSearch({
  localIndex,
  cellId,
  posLabel,
  nationName,
  disabled,
  onSubmit,
  onValidating,
  onResolve,
  onCellGone,
}: {
  localIndex: LocalPlayer[];
  cellId: string | null;
  posLabel: string | null;
  nationName: string;
  disabled: boolean;
  /** Place the pick (optimistically) and validate; resolves with the result. */
  onSubmit: (cellId: string, player: PlayerHit) => Promise<ClaimResult>;
  /** Open a "validating…" notice for this pick; returns its id. */
  onValidating: (playerName: string) => number;
  /** Morph that notice into the result (valid, or WHY it failed). */
  onResolve: (id: number, msg: string, kind: ToastKind) => void;
  /** Drop the selection (Escape on an empty query). */
  onCellGone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlayerHit[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  /** Only drives the input's error shake — the cause goes to the toasts. */
  const [error, setError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);
  /** Synchronous in-flight guard: blocks a double-submit within the same tick,
   * before `submitting` state has a chance to re-render the disabled rows. */
  const submittingRef = useRef(false);
  /** Per-session memo of server fallback responses, keyed by normalized query. */
  const cacheRef = useRef(new Map<string, PlayerHit[]>());

  const active = cellId != null && !disabled;

  // Merge server hits after the instant local ones (deduped, capped).
  const mergeServer = useCallback((local: PlayerHit[], server: PlayerHit[]) => {
    const seen = new Set(local.map((h) => h.id));
    const merged = [...local];
    for (const s of server) {
      if (seen.has(s.id)) continue;
      merged.push(s);
      if (merged.length >= SEARCH_LIMIT) break;
    }
    setHits(merged);
    setHighlight(0);
  }, []);

  // Focus follows the selection — including re-targeting another cell, which
  // must NOT reset the typed query (the component stays mounted; only a
  // successful claim clears it, in the submit handler).
  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active, cellId]);

  // Close the dropdown on any click outside the input + suggestions. The typed
  // query stays; only the stale suggestions go until the player edits again.
  useEffect(() => {
    if (hits.length === 0) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        seqRef.current++;
        setHits([]);
        setHighlight(0);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [hits.length]);

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

  // Debounced SERVER fallback, scheduled only when the instant local list (set
  // synchronously in onQueryChange) isn't full — i.e. a rare name outside the
  // top index. The merge runs inside the timer, never synchronously here.
  useEffect(() => {
    if (!active) return;
    const q = query.trim();
    if (q.length < 3) return;
    const local = localSearch(localIndex, q);
    if (local.length >= SEARCH_LIMIT) return;
    const key = q.toLowerCase();
    const cached = cacheRef.current.get(key);
    const seq = ++seqRef.current;
    const t = setTimeout(
      async () => {
        const found = cached ?? (await searchPlayers(q));
        if (!cached) cacheRef.current.set(key, found);
        if (seqRef.current !== seq) return;
        mergeServer(local, found);
      },
      cached ? 0 : SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [query, active, localIndex, mergeServer]);

  const submit = async (player: PlayerHit) => {
    if (!cellId || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(false);
    // Announce the validation; the token shows its spinner meanwhile.
    const toastId = onValidating(player.name);
    const res = await onSubmit(cellId, player);
    submittingRef.current = false;
    setSubmitting(false);
    // Either way the search field is emptied — ready for the next pick.
    seqRef.current++;
    setQuery("");
    setHits([]);
    setHighlight(0);
    if (res.ok) {
      onResolve(toastId, `✓ ${player.name} es válido`, "success");
      return;
    }
    onResolve(toastId, rejectMessage(res.code, player), "error");
    if (res.code === "CELL_TAKEN" || res.code === "ENDED") return;
    // Wrong guess: clear the field, shake, keep the cell selected to retry.
    setError(true);
    inputRef.current?.focus();
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    setError(false);
    // Instant local suggestions (event-driven, so no setState-in-effect).
    seqRef.current++;
    const q = value.trim();
    setHits(q.length < 2 ? [] : localSearch(localIndex, q));
    setHighlight(0);
  };

  // Clicking back into the input re-runs the local search to reopen a dropdown
  // an outside click had closed (no-op when already open or query too short).
  const reopenDropdown = () => {
    if (!active || submitting || hits.length > 0 || query.trim().length < 2) return;
    setHits(localSearch(localIndex, query));
    setHighlight(0);
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
    <div className="psearch" ref={rootRef}>
      <div className={`gc-input${active ? "" : " off"}${error ? " err" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          disabled={!active || submitting}
          placeholder={
            active
              ? `${posLabel} de ${nationName}…`
              : "Elige una casilla libre del campo"
          }
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          onClick={reopenDropdown}
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

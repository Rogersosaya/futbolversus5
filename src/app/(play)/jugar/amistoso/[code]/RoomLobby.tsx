"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

import { FlagSvg, Icon } from "@/components/svg";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { AvatarArt, ShieldArt } from "@/components/game-art";
import { Stars, StatRow } from "@/components/lobby/parts";
import { useOnline } from "@/components/realtime/presence";
import { createClient } from "@/lib/supabase-browser";
import { roomTopicFor, SYNC_EVENT } from "@/lib/realtime-topics";
import {
  ENTRY_MS,
  HOLD_MS,
  SLAM_MS,
  TIMELINE_TOTAL_MS,
  phaseAt,
  type MatchPhase,
} from "@/lib/match-timeline";
import {
  beginMatchEntry,
  getRoomPeers,
  leaveRoom,
  sendMatchInvite,
} from "@/app/actions/matchroom";
import type { RoomLobbyData } from "@/actions/matchroom";
import type { PlayerCard, SelfMatchCard } from "@/actions/friends";

const DIFFICULTY_LABELS: Record<string, string> = {
  Fácil: "Canterano",
  Medio: "Titular",
  Difícil: "Leyenda",
};

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

function PlayerTeamCard({ player, incoming }: { player: SelfMatchCard; incoming?: boolean }) {
  const stats = [
    { label: "NIVEL", value: String(player.level) },
    { label: "PODER", value: String(player.power) },
    { label: "VICT.", value: `${player.winPct}%` },
  ];
  return (
    <div className={`team lb-team${incoming ? " in" : ""}`}>
      <div className="country-bar">
        <span className="cn">{player.countryName || "—"}</span>
        {player.country && (
          <span className="flag">
            <FlagSvg code={player.country} />
          </span>
        )}
      </div>
      <div className="team-card">
        <div className="pres-chip">
          <span className="pc-av">
            {player.avatarArt ? <CollectibleGlyph c={player.avatarArt} /> : <AvatarArt id={null} />}
          </span>
          <span className="pc-tx">
            <small>PRESIDENTE</small>
            <b>{player.president}</b>
          </span>
        </div>
        <div className="team-name">{player.club}</div>
        <div className="crest-row">
          <span className="crest">
            {player.art ? <CollectibleGlyph c={player.art} /> : <ShieldArt id={null} />}
          </span>
        </div>
        <Stars rating={player.power} />
        <StatRow stats={stats} />
      </div>
    </div>
  );
}

function InvitePanel({
  code,
  friends,
  invitedIds,
  onInvited,
}: {
  code: string;
  friends: PlayerCard[];
  invitedIds: string[];
  onInvited: () => void;
}) {
  const online = useOnline();
  const [copied, setCopied] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const invited = new Set(invitedIds);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/jugar/amistoso/${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const invite = async (friendId: string) => {
    setSendingId(friendId);
    await sendMatchInvite(code, friendId);
    setSendingId(null);
    onInvited();
  };

  return (
    <div className="invite">
      <div className="inv-block">
        <div className="inv-label">ENLACE DE INVITACIÓN</div>
        <div className="inv-link">
          <span className="il-txt">
            jugar/amistoso/<b>{code}</b>
          </span>
          <button className={`il-copy${copied ? " done" : ""}`} onClick={copy}>
            {copied ? "✓ COPIADO" : (<><CopyIcon />COPIAR</>)}
          </button>
        </div>
      </div>
      <div className="inv-or">
        <span>O INVITA A UN AMIGO</span>
      </div>
      <div className="friends">
        {friends.length === 0 ? (
          <div className="friends-empty">
            Agrega amigos desde <b>Mi Club</b> para invitarlos aquí.
          </div>
        ) : (
          friends.map((f) => {
            const isOnline = online.has(f.id);
            const isInvited = invited.has(f.id);
            return (
              <div className="friend" key={f.id}>
                <span className="fr-av crest">
                  {f.art ? <CollectibleGlyph c={f.art} /> : <ShieldArt id={null} />}
                </span>
                <span className="fr-tx">
                  <b>{f.president}</b>
                  <small>{f.club}</small>
                </span>
                <span className={`fr-st ${isInvited ? "idle" : isOnline ? "on" : "off"}`}>
                  {isInvited ? "Invitado" : isOnline ? "En línea" : "Desconectado"}
                </span>
                <button
                  className="fr-inv"
                  disabled={!isOnline || isInvited || sendingId === f.id}
                  onClick={() => invite(f.id)}
                >
                  {isInvited ? "ENVIADA" : sendingId === f.id ? "…" : "INVITAR"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * The stadium-entry cinematic: locker-room tunnel rushing past, the light at
 * the end growing, floodlights flaring, the pitch revealed. Purely
 * presentational — its clock is the shared room timeline: `offsetMs` (how far
 * into the beat this client is) becomes a negative animation-delay, so a
 * refresh mid-cinematic resumes at the exact same frame the rival is seeing.
 */
function StadiumEntry({
  readyAt,
  skew,
  meClub,
  rivalClub,
}: {
  readyAt: number;
  skew: number;
  meClub: string;
  rivalClub: string;
}) {
  // Frozen at mount so re-renders never restart the CSS animations.
  const [offsetMs] = useState(() =>
    Math.max(Date.now() + skew - readyAt - SLAM_MS - HOLD_MS, 0),
  );
  const vars = {
    "--entry-ms": `${ENTRY_MS}ms`,
    "--entry-offset": `${-offsetMs}ms`,
  } as CSSProperties;

  return (
    <div className="stadium-entry" style={vars} role="status" aria-live="polite">
      <div className="se-black" />
      <div className="se-rush" />
      <div className="se-rush r2" />
      <div className="se-mouth" />
      <div className="se-beam b1" />
      <div className="se-beam b2" />
      <div className="se-text">
        <span className="se-tag">TÚNEL DE VESTUARIOS</span>
        <div className="se-title">
          SALIENDO
          <br />
          AL CAMPO
        </div>
        <div className="se-clubs">
          <b>{meClub}</b>
          <i>VS</i>
          <b>{rivalClub}</b>
        </div>
      </div>
      <div className="se-flash" />
      <div className="se-pitch" />
    </div>
  );
}

/**
 * The live lobby of a match room.
 *
 * Synchronization model: the room row in Postgres is the single source of
 * truth (status OPEN → READY → IN_GAME → CLOSED plus the server-stamped
 * `readyAt`). Server actions ping the room's Broadcast topic after every
 * mutation and both clients re-fetch. The same channel carries Presence, so
 * the lobby knows when BOTH players are actually sitting in it: at that moment
 * either client asks the server to stamp `readyAt` (idempotent, first write
 * wins) and from then on everything — VS slam, stadium-entry cinematic,
 * navigation into the game room — is derived from that one shared timestamp
 * with client clock-skew correction. Refreshes resume mid-beat; if the guest
 * leaves before kickoff the anchor is cleared and the lobby falls back.
 */
export function RoomLobby({ initial }: { initial: RoomLobbyData }) {
  const router = useRouter();
  const { room, role, me } = initial;
  const arenaHref = `/jugar/amistoso/${room.code}/partido`;

  const [status, setStatus] = useState(room.status);
  const [rival, setRival] = useState<SelfMatchCard | null>(initial.rival);
  const [invitedIds, setInvitedIds] = useState<string[]>(initial.invitedIds);
  const [readyAt, setReadyAt] = useState<number | null>(room.readyAt);
  const [present, setPresent] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<MatchPhase | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Server-clock skew (serverNow − clientNow), refreshed with every snapshot.
  const [skew, setSkew] = useState(() => initial.serverNow - Date.now());
  const navigatedRef = useRef(false);
  const beginInFlight = useRef(false);

  const goToArena = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace(arenaHref);
  }, [router, arenaHref]);

  const refetch = useCallback(async () => {
    const peers = await getRoomPeers(room.code);
    if (!peers) return;
    setSkew(peers.serverNow - Date.now());
    setStatus(peers.status);
    setInvitedIds(peers.invitedIds);
    setRival(peers.rival);
    setReadyAt(peers.readyAt);
  }, [room.code]);

  // One Realtime channel per room: Broadcast (server pings after each
  // mutation → re-sync through server actions) + Presence (who is actually
  // sitting in this lobby right now). Re-subscribing after a reconnection
  // re-fetches, so missed pings can't leave the client stale.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(roomTopicFor(room.id), {
      config: { presence: { key: me.id } },
    });
    const syncPresence = () =>
      setPresent(new Set(Object.keys(channel.presenceState())));
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
  }, [room.id, me.id, refetch]);

  // Prefetch the arena so the post-cinematic redirect is near-instant.
  useEffect(() => {
    if (status === "READY" || status === "IN_GAME") router.prefetch(arenaHref);
  }, [status, router, arenaHref]);

  // Both members confirmed present in a READY lobby with no timeline anchor
  // yet → ask the server to stamp it. Idempotent and race-safe server-side,
  // so it doesn't matter that both clients fire this at the same time.
  useEffect(() => {
    if (status !== "READY" || !rival || readyAt != null) return;
    if (!present.has(me.id) || !present.has(rival.id)) return;
    if (beginInFlight.current) return;
    beginInFlight.current = true;
    beginMatchEntry(room.code)
      .then((res) => {
        if (res) {
          setSkew(res.serverNow - Date.now());
          setReadyAt(res.readyAt);
        }
      })
      .finally(() => {
        beginInFlight.current = false;
      });
  }, [status, rival, readyAt, present, me.id, room.code]);

  // Walk the shared timeline: compute the current beat from the server-anchored
  // elapsed time and schedule a wake-up at the next boundary. A refresh or a
  // late joiner resumes mid-beat; once past the end, go straight to the arena.
  // Every state change is deferred through a tracked timeout (no sync setState
  // in the effect body).
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const defer = (fn: () => void, ms = 0) => timers.push(setTimeout(fn, ms));

    if (status === "CLOSED" || (status !== "READY" && status !== "IN_GAME")) {
      defer(() => setPhase(null));
    } else if (readyAt == null) {
      defer(() => {
        setPhase(null);
        // IN_GAME without an anchor (shouldn't happen) — never strand a player.
        if (status === "IN_GAME") goToArena();
      });
    } else {
      const tick = () => {
        const elapsed = Date.now() + skew - readyAt;
        const p = phaseAt(elapsed);
        setPhase(p);
        if (p === "done") {
          goToArena();
          return;
        }
        const next = [SLAM_MS, SLAM_MS + HOLD_MS, TIMELINE_TOTAL_MS].find((b) => b > elapsed)!;
        defer(tick, Math.max(next - elapsed, 16));
      };
      defer(tick);
    }
    return () => timers.forEach(clearTimeout);
  }, [readyAt, status, skew, goToArena]);

  // The host dissolved the room while the guest was sitting in it.
  const closedByHost = role === "guest" && status === "CLOSED";
  useEffect(() => {
    if (!closedByHost) return;
    const t = setTimeout(() => router.replace("/amistoso"), 2400);
    return () => clearTimeout(t);
  }, [closedByHost, router]);

  const leave = async () => {
    setLeaving(true);
    await leaveRoom(room.code);
    router.push("/amistoso");
  };

  const ready = status === "READY" && !!rival;
  const sequenceRunning = phase != null;
  const difLabel = room.difficulty
    ? DIFFICULTY_LABELS[room.difficulty] ?? room.difficulty
    : null;
  const detail = [room.gameName, difLabel].filter(Boolean).join(" · ");

  const renderCenter = () => {
    if (closedByHost) {
      return (
        <>
          <span className="ctx-tag">SALA CERRADA</span>
          <div className="ctx-title">
            EL ANFITRIÓN
            <br />
            SE RETIRÓ
          </div>
          <div className="ctx-sub">Volviendo a amistosos…</div>
        </>
      );
    }
    if (ready || status === "IN_GAME") {
      return (
        <>
          <span className="ctx-tag good">✓ RIVAL ENCONTRADO</span>
          <div className="vs-big">VS</div>
          <div className="ctx-sub entering">
            <span className="td" />
            {sequenceRunning ? "Saliendo al campo…" : "Preparando la entrada al estadio…"}
          </div>
          {detail && <div className="ctx-sub">{detail}</div>}
        </>
      );
    }
    return (
      <>
        <span className="ctx-tag">PARTIDO AMISTOSO</span>
        <div className="ctx-title">
          INVITA A
          <br />
          UN RIVAL
        </div>
        <div className="ctx-sub">
          {detail ? `${detail} · sin ranking en juego` : "Sin ranking ni valor en juego"}
        </div>
      </>
    );
  };

  const renderRight = () => {
    if (rival) return <PlayerTeamCard player={rival} incoming />;
    if (role === "host") {
      return (
        <InvitePanel
          code={room.code}
          friends={initial.friends}
          invitedIds={invitedIds}
          onInvited={refetch}
        />
      );
    }
    return null;
  };

  return (
    <div className="lobby-layer on">
      <div
        className={`lobby amistoso st-${ready || status === "IN_GAME" ? "ready" : "invite"}${
          phase === "slam" ? " slamming shaking" : ""
        }`}
      >
        <div className="bg">
          <div className="streaks" />
          <div className="vignette" />
        </div>

        <div className="lobby-top">
          <button className="back-chip" disabled={leaving || sequenceRunning} onClick={leave}>
            <BackArrowIcon /> {role === "host" ? "Cerrar sala" : "Salir"}
          </button>
          <span className="route-badge">
            <Icon id="whistle" width={16} height={16} /> AMISTOSO
          </span>
          <span className="room-code-chip" title="Código de sala">
            SALA <b>{room.code}</b>
          </span>
        </div>

        <div className="side-label local">TÚ</div>
        <div className="side-label away">RIVAL</div>

        <div className="lobby-cols">
          <div className="lb-col">
            <PlayerTeamCard player={me} />
          </div>
          <div className="lobby-center">{renderCenter()}</div>
          <div className="lb-col">{renderRight()}</div>
        </div>

        {phase === "slam" && (
          <div className="vs-slam">
            <div className="slam-flash" />
            <div className="slam-gash" />
            <div className="slam-ring" />
            <div className="slam-vs">VS</div>
          </div>
        )}

        {(phase === "entry" || phase === "done") && readyAt != null && rival && (
          <StadiumEntry
            readyAt={readyAt}
            skew={skew}
            meClub={me.club}
            rivalClub={rival.club}
          />
        )}
      </div>
    </div>
  );
}

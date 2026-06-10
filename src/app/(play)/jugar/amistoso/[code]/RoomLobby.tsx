"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FlagSvg, Icon } from "@/components/svg";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { AvatarArt, ShieldArt } from "@/components/game-art";
import { Stars, StatRow } from "@/components/lobby/parts";
import { useOnline } from "@/components/realtime/presence";
import { createClient } from "@/lib/supabase-browser";
import { roomTopicFor, SYNC_EVENT } from "@/lib/realtime-topics";
import { getRoomPeers, leaveRoom, sendMatchInvite } from "@/app/actions/matchroom";
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
 * The live lobby of a match room. Subscribes to the room (and its invites)
 * over Supabase Realtime: when the rival takes the seat both players see the
 * "match found" VS slam; when someone leaves, the lobby reacts accordingly.
 */
export function RoomLobby({ initial }: { initial: RoomLobbyData }) {
  const router = useRouter();
  const { room, role, me } = initial;

  const [status, setStatus] = useState(room.status);
  const [rival, setRival] = useState<SelfMatchCard | null>(initial.rival);
  const [invitedIds, setInvitedIds] = useState<string[]>(initial.invitedIds);
  const [leaving, setLeaving] = useState(false);

  // VS slam choreography (same beats as the liga lobby overlay).
  const [slam, setSlam] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [slamming, setSlamming] = useState(false);
  const slamTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rivalRef = useRef<string | null>(initial.rival?.id ?? null);

  const playSlam = useCallback(() => {
    setSlam(true);
    setSlamming(true);
    setShaking(true);
    slamTimers.current.push(setTimeout(() => setShaking(false), 560));
    slamTimers.current.push(setTimeout(() => setSlamming(false), 780));
    slamTimers.current.push(setTimeout(() => setSlam(false), 1100));
  }, []);

  useEffect(() => () => slamTimers.current.forEach(clearTimeout), []);

  // Fire the match-found slam once per room when arriving at a READY lobby
  // (e.g. the guest landing right after accepting an invite). Deferred via a
  // tracked timeout so the entrance beat isn't a sync setState in the effect.
  useEffect(() => {
    if (!initial.rival) return;
    slamTimers.current.push(
      setTimeout(() => {
        const key = `vsslam:${room.code}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        playSlam();
      }, 80),
    );
  }, [initial.rival, room.code, playSlam]);

  const refetch = useCallback(async () => {
    const peers = await getRoomPeers(room.code);
    if (!peers) return;
    setStatus(peers.status);
    setInvitedIds(peers.invitedIds);
    setRival(peers.rival);
    const newRivalId = peers.rival?.id ?? null;
    if (newRivalId && rivalRef.current !== newRivalId) {
      sessionStorage.setItem(`vsslam:${room.code}`, "1");
      playSlam();
    }
    rivalRef.current = newRivalId;
  }, [room.code, playSlam]);

  // Live room: every room mutation (seat claimed/freed, closed, invite
  // changes) pings this room's Broadcast topic server-side → re-sync.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(roomTopicFor(room.id))
      .on("broadcast", { event: SYNC_EVENT }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, refetch]);

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
    if (ready) {
      return (
        <>
          <span className="ctx-tag good">✓ RIVAL ENCONTRADO</span>
          <div className="vs-big">VS</div>
          <button className="btn-play sm" disabled title="Disponible pronto">
            COMENZAR <Icon id="arr" />
          </button>
          <div className="ctx-sub">{detail || "Partido amistoso"} · el duelo en vivo llega pronto</div>
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
        className={`lobby amistoso st-${ready ? "ready" : "invite"}${slamming ? " slamming" : ""}${shaking ? " shaking" : ""}`}
      >
        <div className="bg">
          <div className="streaks" />
          <div className="vignette" />
        </div>

        <div className="lobby-top">
          <button className="back-chip" disabled={leaving} onClick={leave}>
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

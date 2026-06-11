"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

import { CollectibleGlyph } from "@/components/CollectibleArt";
import { ShieldArt } from "@/components/game-art";
import { createClient } from "@/lib/supabase-browser";
import { roomTopicFor, SYNC_EVENT } from "@/lib/realtime-topics";
import { getRoomPeers, leaveRoom } from "@/app/actions/matchroom";
import type { ArenaData } from "@/actions/matchroom";
import type { SelfMatchCard } from "@/actions/friends";
import { BOARD_CELLS } from "@/data/gameboard";

/** Fixed side colors: the local player is always the light side, the rival
 * the red side — mirrors the GameOverlay convention. */
const ME_SIDE = { own: "#eef1f7", glow: "rgba(238,241,247,.75)" };
const RIVAL_SIDE = { own: "#e8344f", glow: "rgba(232,52,79,.75)" };

/** How long the synchronized kickoff banner stays up (from startedAt). */
const KICKOFF_MS = 2600;

const sideStyle = (s: { own: string; glow: string }): CSSProperties =>
  ({ "--own": s.own, "--own-glow": s.glow } as CSSProperties);

const pad = (n: number) => String(n).padStart(2, "0");

function ScoreTeam({
  player,
  side,
  away,
}: {
  player: SelfMatchCard;
  side: { own: string; glow: string };
  away?: boolean;
}) {
  return (
    <div className={`gs-team ${away ? "away" : "home"}`}>
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

/**
 * The live game room. The match itself isn't wired yet, so this renders the
 * official-kickoff experience over real shared state: broadcast-style
 * scoreboard at 0-0 with both presidents' actual cards, a clock derived from
 * the room's server-stamped startedAt (identical on both screens), the empty
 * XI board, and a synchronized kickoff banner. Stays subscribed to the room's
 * Realtime channel: if the rival abandons (room CLOSED) both the overlay and
 * the redirect fire; Presence flags a rival who lost connection.
 */
export function MatchArena({ initial }: { initial: ArenaData }) {
  const router = useRouter();
  const { room, me, rival } = initial;

  // Server-clock skew (serverNow − clientNow), refreshed with every snapshot.
  const [skew, setSkew] = useState(() => initial.serverNow - Date.now());
  const leavingRef = useRef(false);

  const [closed, setClosed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [rivalPresent, setRivalPresent] = useState(true);
  const [clock, setClock] = useState("00:00");
  const [kickoff, setKickoff] = useState(
    () => room.startedAt != null && initial.serverNow - room.startedAt < KICKOFF_MS,
  );

  const refetch = useCallback(async () => {
    // Leaving closes the room — don't let our own ping flash the overlay.
    if (leavingRef.current) return;
    const peers = await getRoomPeers(room.code);
    if (!peers) return;
    setSkew(peers.serverNow - Date.now());
    // Any state other than IN_GAME means the match is over for this screen.
    if (peers.status !== "IN_GAME") setClosed(true);
  }, [room.code]);

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

  // Match clock off the shared server anchor — both screens tick in step.
  // The first paint is deferred to the next tick (no sync setState in effect).
  useEffect(() => {
    if (room.startedAt == null || closed) return;
    const startedAt = room.startedAt;
    const tick = () => {
      const s = Math.max(Math.floor((Date.now() + skew - startedAt) / 1000), 0);
      setClock(`${pad(Math.floor(s / 60))}:${pad(s % 60)}`);
    };
    const t = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [room.startedAt, closed, skew]);

  // Hide the kickoff banner when its shared window ends.
  useEffect(() => {
    if (!kickoff || room.startedAt == null) return;
    const remaining = room.startedAt + KICKOFF_MS - (Date.now() + skew);
    const t = setTimeout(() => setKickoff(false), Math.max(remaining, 0));
    return () => clearTimeout(t);
  }, [kickoff, room.startedAt, skew]);

  // The rival abandoned (or the room got closed elsewhere) → exit gracefully.
  useEffect(() => {
    if (!closed || leavingRef.current) return;
    const t = setTimeout(() => router.replace("/amistoso"), 2600);
    return () => clearTimeout(t);
  }, [closed, router]);

  const leave = async () => {
    leavingRef.current = true;
    setLeaving(true);
    await leaveRoom(room.code);
    router.push("/amistoso");
  };

  return (
    <div className="game-layer on arena">
      <div className="game">
        <div className="game-bg">
          <div className="crowd" />
        </div>

        <button className="game-exit" disabled={leaving} onClick={leave}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>{" "}
          Abandonar partido
        </button>

        {!rivalPresent && !closed && (
          <div className="conn-chip">
            <span className="cd" />
            EL RIVAL SE ESTÁ RECONECTANDO
          </div>
        )}

        <div className="gscore">
          <ScoreTeam player={me} side={ME_SIDE} />
          <div className="gs-num">
            <b>0</b>
          </div>
          <div className="gs-mid">
            <span className="gs-time">{clock}</span>
            <span className="gs-half">
              <span className="lv" />
              1.ª PARTE
            </span>
          </div>
          <div className="gs-num">
            <b>0</b>
          </div>
          <ScoreTeam player={rival} side={RIVAL_SIDE} away />
        </div>

        <div className="arena-wait">
          <span className="wd" />
          <span>
            {room.gameName
              ? `${room.gameName.toUpperCase()} · EL DUELO COMIENZA EN BREVE`
              : "EL DUELO COMIENZA EN BREVE"}
          </span>
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
            {BOARD_CELLS.map((cell) => (
              <div
                key={cell.id}
                className="tok empty"
                style={{ left: `${cell.x}%`, top: `${cell.y}%` }}
              >
                <div className="disc">
                  <span className="pos">{cell.pos}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {kickoff && !closed && (
          <div className="kickoff">
            <div className="ko-t">¡COMIENZA EL PARTIDO!</div>
          </div>
        )}

        {closed && (
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

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FlagSvg, Icon } from "@/components/svg";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { AvatarArt, ShieldArt } from "@/components/game-art";
import { Stars, StatRow } from "@/components/lobby/parts";
import { joinRoomByCode } from "@/app/actions/matchroom";
import type { RoomJoinData } from "@/actions/matchroom";

const DIFFICULTY_LABELS: Record<string, string> = {
  Fácil: "Canterano",
  Medio: "Titular",
  Difícil: "Leyenda",
};

/**
 * What a visitor sees when opening an invite link while the rival seat is
 * still free: the host's club and a single decisive CTA. The seat is claimed
 * atomically on accept — the first president to do so gets the match.
 */
export function RoomJoin({ data }: { data: RoomJoinData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { host } = data;

  const stats = [
    { label: "NIVEL", value: String(host.level) },
    { label: "PODER", value: String(host.power) },
    { label: "VICT.", value: `${host.winPct}%` },
  ];

  const accept = () => {
    setError(null);
    startTransition(async () => {
      const res = await joinRoomByCode(data.code);
      if (res.ok) {
        // Re-render the page as a room member → the lobby + match animation.
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo entrar a la sala.");
      }
    });
  };

  const difLabel = data.difficulty
    ? DIFFICULTY_LABELS[data.difficulty] ?? data.difficulty
    : null;
  const detail = [data.gameName, difLabel].filter(Boolean).join(" · ");

  return (
    <div className="lobby-layer on">
      <div className="lobby amistoso">
        <div className="bg">
          <div className="streaks" />
          <div className="vignette" />
        </div>

        <div className="lobby-top">
          <span className="lobby-top-sp" />
          <span className="route-badge">
            <Icon id="whistle" width={16} height={16} /> AMISTOSO
          </span>
          <span className="lobby-top-sp" />
        </div>

        <div className="join-wrap">
          <div className="team lb-team">
            <div className="country-bar">
              <span className="cn">{host.countryName || "—"}</span>
              {host.country && (
                <span className="flag">
                  <FlagSvg code={host.country} />
                </span>
              )}
            </div>
            <div className="team-card">
              <div className="pres-chip">
                <span className="pc-av">
                  {host.avatarArt ? <CollectibleGlyph c={host.avatarArt} /> : <AvatarArt id={null} />}
                </span>
                <span className="pc-tx">
                  <small>PRESIDENTE</small>
                  <b>{host.president}</b>
                </span>
              </div>
              <div className="team-name">{host.club}</div>
              <div className="crest-row">
                <span className="crest">
                  {host.art ? <CollectibleGlyph c={host.art} /> : <ShieldArt id={null} />}
                </span>
              </div>
              <Stars rating={host.power} />
              <StatRow stats={stats} />
            </div>
          </div>

          <div className="join-cta">
            <span className="ctx-tag">PARTIDO AMISTOSO</span>
            <div className="ctx-title">
              TE DESAFÍA
              <br />A UN VERSUS
            </div>
            <div className="ctx-sub">
              {detail || "Sin ranking ni valor en juego"} · el primero en aceptar ocupa el lugar
            </div>
            <button className="btn-play sm" disabled={isPending} onClick={accept}>
              {isPending ? "ENTRANDO…" : <>ACEPTAR PARTIDO <Icon id="arr" /></>}
            </button>
            <button className="join-decline" onClick={() => router.push("/amistoso")}>
              Ahora no
            </button>
            {error && <div className="join-error" role="alert">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

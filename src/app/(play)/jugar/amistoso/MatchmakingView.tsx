"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { FlagSvg, Icon } from "@/components/svg";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { AvatarArt, ShieldArt } from "@/components/game-art";
import { Stars, StatRow } from "@/components/lobby/parts";
import { usePresence } from "@/components/realtime/usePresence";
import type { PlayerCard } from "@/actions/friends";
import type { SelfMatchCard } from "@/actions/friends";

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

function MeCard({ me }: { me: SelfMatchCard }) {
  const stats = [
    { label: "NIVEL", value: String(me.level) },
    { label: "PODER", value: String(me.power) },
    { label: "VICT.", value: `${me.winPct}%` },
  ];
  return (
    <div className="team lb-team">
      <div className="country-bar">
        <span className="cn">{me.countryName || "—"}</span>
        {me.country && (
          <span className="flag">
            <FlagSvg code={me.country} />
          </span>
        )}
      </div>
      <div className="team-card">
        <div className="pres-chip">
          <span className="pc-av">
            {me.avatarArt ? <CollectibleGlyph c={me.avatarArt} /> : <AvatarArt id={null} />}
          </span>
          <span className="pc-tx">
            <small>PRESIDENTE</small>
            <b>{me.president}</b>
          </span>
        </div>
        <div className="team-name">{me.club}</div>
        <div className="crest-row">
          <span className="crest">
            {me.art ? <CollectibleGlyph c={me.art} /> : <ShieldArt id={null} />}
          </span>
        </div>
        <Stars rating={me.power} />
        <StatRow stats={stats} />
      </div>
    </div>
  );
}

function InvitePanel({
  inviteCode,
  friends,
  online,
}: {
  inviteCode: string;
  friends: PlayerCard[];
  online: Set<string>;
}) {
  const [copied, setCopied] = useState(false);
  const link = `versus.gg/inv/${inviteCode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="invite">
      <div className="inv-block">
        <div className="inv-label">ENLACE DE INVITACIÓN</div>
        <div className="inv-link">
          <span className="il-txt">
            versus.gg/inv/<b>{inviteCode}</b>
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
            return (
              <div className="friend" key={f.id}>
                <span className="fr-av crest">
                  {f.art ? <CollectibleGlyph c={f.art} /> : <ShieldArt id={null} />}
                </span>
                <span className="fr-tx">
                  <b>{f.president}</b>
                  <small>{f.club}</small>
                </span>
                <span className={`fr-st ${isOnline ? "on" : "off"}`}>
                  {isOnline ? "En línea" : "Desconectado"}
                </span>
                <button className="fr-inv" disabled={!isOnline} title="Disponible pronto">
                  INVITAR
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function MatchmakingView({
  userId,
  me,
  friends,
  inviteCode,
  difficulty,
}: {
  userId: string;
  me: SelfMatchCard;
  friends: PlayerCard[];
  inviteCode: string;
  difficulty: string | null;
}) {
  const router = useRouter();
  const online = usePresence(userId);
  const difLabel = difficulty ? DIFFICULTY_LABELS[difficulty] ?? difficulty : null;

  return (
    <div className="lobby-layer on">
      <div className="lobby amistoso st-invite">
        <div className="bg">
          <div className="streaks" />
          <div className="vignette" />
        </div>

        <div className="lobby-top">
          <button className="back-chip" onClick={() => router.push("/amistoso")}>
            <BackArrowIcon /> Volver
          </button>
          <span className="route-badge">
            <Icon id="whistle" width={16} height={16} /> AMISTOSO
          </span>
          <span className="lobby-top-sp" />
        </div>

        <div className="side-label local">TÚ</div>
        <div className="side-label away">RIVAL</div>

        <div className="lobby-cols">
          <div className="lb-col">
            <MeCard me={me} />
          </div>
          <div className="lobby-center">
            <span className="ctx-tag">PARTIDO AMISTOSO</span>
            <div className="ctx-title">
              INVITA A
              <br />
              UN RIVAL
            </div>
            <div className="ctx-sub">
              {difLabel ? `Dificultad: ${difLabel} · sin ranking en juego` : "Sin ranking ni valor en juego"}
            </div>
          </div>
          <div className="lb-col">
            <InvitePanel inviteCode={inviteCode} friends={friends} online={online} />
          </div>
        </div>
      </div>
    </div>
  );
}

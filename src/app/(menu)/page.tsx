"use client";

import Link from "next/link";

import { FlagSvg, Icon } from "@/components/svg";
import { AvatarArt, ShieldArt, StadiumArt } from "@/components/game-art";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { useProfile } from "@/components/ProfileContext";
import { useOverlay } from "@/components/overlay-context";

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/** Liga view — the default Menú landing. The club the user presides over,
 *  staged inside its own home stadium, with the "Partido de Liga" CTA. */
export default function LigaPage() {
  const { openLobby } = useOverlay();
  const profile = useProfile();
  const league = profile.currentLeague;

  const stadiumImg = profile.stadiumArt?.imageUrl ?? null;
  const stadiumName = profile.stadiumName;
  const clubName = profile.clubName ?? "Tu Club";

  return (
    <div className="liga">
      {stadiumImg ? (
        <div className="liga-bg" style={{ backgroundImage: `url('${stadiumImg}')` }} />
      ) : (
        <div className="liga-bg liga-bg--art">
          {profile.stadiumArt ? (
            <CollectibleGlyph c={profile.stadiumArt} />
          ) : (
            <StadiumArt id={profile.stadiumId} />
          )}
        </div>
      )}
      <div className="liga-scrim" />
      <div className="liga-inner">
        <div className="liga-head">
          <Link className="league-chip" href="/ligas">
            <span className="lc-em">
              <FlagSvg code={league?.countryCode ?? "pe"} slice />
            </span>
            <span className="lc-tx">
              <small>LIGA ACTUAL · FECHA 7</small>
              <b>
                {(league?.name ?? "Liga 1").toUpperCase()} ·{" "}
                {(league?.country ?? "Perú").toUpperCase()}
              </b>
            </span>
            <span className="lc-go">
              RUTA DE LIGAS <ChevronIcon />
            </span>
          </Link>

          {stadiumName && (
            <div className="liga-venue">
              <span className="lv-ic">
                <Icon id="stadium" />
              </span>
              <span className="lv-tx">
                <small>TU ESTADIO</small>
                <b>{stadiumName.toUpperCase()}</b>
              </span>
            </div>
          )}
        </div>

        <div className="liga-hero">
          <div className="liga-club">
            <div className="liga-crest">
              {profile.shieldArt ? (
                <CollectibleGlyph c={profile.shieldArt} />
              ) : (
                <ShieldArt id={profile.shieldId} />
              )}
            </div>
            <div className="liga-club-tx">
              <span className="liga-eyebrow">DIRIGES A</span>
              <h2 className="liga-club-name">{clubName.toUpperCase()}</h2>
              <div className="liga-pres">
                <span className="lp-av">
                  {profile.avatarArt ? (
                    <CollectibleGlyph c={profile.avatarArt} />
                  ) : (
                    <AvatarArt id={profile.avatarId} />
                  )}
                </span>
                <span className="lp-tx">
                  <small>PRESIDENTE</small>
                  <b>{profile.presidentName.toUpperCase()}</b>
                </span>
                {profile.country && (
                  <span className="lp-flag">
                    <FlagSvg code={profile.country} />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="liga-actions">
            <p className="liga-sub">
              Sal a jugar el partido de liga. Cada acierto es un ataque; cada fallo, un
              contragolpe rival.
            </p>
            <button className="btn-play" onClick={() => openLobby("liga")}>
              JUGAR <Icon id="arr" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

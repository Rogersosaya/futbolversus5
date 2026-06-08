"use client";

import Link from "next/link";

import { FlagSvg, Icon } from "@/components/svg";
import { AvatarArt, ShieldArt } from "@/components/game-art";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { useProfile } from "@/components/ProfileContext";
import { useOverlay } from "@/components/overlay-context";

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/** Liga view — the default Menú landing, with the "Partido de Liga" CTA. */
export default function LigaPage() {
  const { openLobby } = useOverlay();
  const profile = useProfile();
  const league = profile.currentLeague;

  return (
    <div className="liga">
      <div className="liga-bg" style={{ backgroundImage: "url('/assets/bombonera.jpg')" }} />
      <div className="liga-grad" />
      <div className="liga-top" />
      <div className="liga-inner">
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

        <div className="liga-hero">
          <div className="liga-avatar">
            {profile.avatarArt ? <CollectibleGlyph c={profile.avatarArt} /> : <AvatarArt id={profile.avatarId} />}
          </div>
          <div className="liga-copy">
            <h2>
              TU CLUB JUEGA
              <br />
              EN <em>LA BOMBONERA</em>
            </h2>
            <p>
              Responde correctamente para anotar. Cada acierto es un ataque; cada fallo, un
              contragolpe rival.
            </p>
          </div>
        </div>

        <div className="liga-row">
          <div className="user-card">
            <div className="ua liga-ua">
              {profile.avatarArt ? <CollectibleGlyph c={profile.avatarArt} /> : <AvatarArt id={profile.avatarId} />}
            </div>
            <div className="ud">
              <div className="un">{profile.presidentName.toUpperCase()}</div>
              <div className="um">
                {profile.country && (
                  <span className="bit">
                    <span className="fl">
                      <FlagSvg code={profile.country} />
                    </span>{" "}
                    {profile.countryName}
                  </span>
                )}
                {profile.shieldId && (
                  <>
                    <span className="sep" />
                    <span className="bit">
                      <span className="cr" style={{ width: 22, height: 22, display: "inline-flex" }}>
                        {profile.shieldArt ? <CollectibleGlyph c={profile.shieldArt} /> : <ShieldArt id={profile.shieldId} />}
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="btn-play" onClick={() => openLobby("liga")}>
            JUGAR <Icon id="arr" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";

import { Crest, FlagSvg, Icon } from "@/components/svg";
import { useOverlay } from "@/components/overlay-context";
import { currentLeagueInfo } from "@/data/leagues";
import { PROFILE } from "@/data/profile";

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/** Liga view — the default Menú landing, with the "Partido de Liga" CTA. */
export default function LigaPage() {
  const { openLobby } = useOverlay();
  const { league } = currentLeagueInfo();

  return (
    <div className="liga">
      <div className="liga-bg" style={{ backgroundImage: "url('/assets/bombonera.jpg')" }} />
      <div className="liga-grad" />
      <div className="liga-top" />
      <div className="liga-inner">
        <Link className="league-chip" href="/ligas">
          <span className="lc-em">
            <FlagSvg code={league.flag} slice />
          </span>
          <span className="lc-tx">
            <small>LIGA ACTUAL · FECHA 7</small>
            <b>
              {league.name.toUpperCase()} · {league.country.toUpperCase()}
            </b>
          </span>
          <span className="lc-go">
            RUTA DE LIGAS <ChevronIcon />
          </span>
        </Link>

        <div className="liga-hero">
          <div className="liga-avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PROFILE.avatar} alt="avatar" />
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
            <div className="ua">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PROFILE.avatar} alt={PROFILE.name} />
            </div>
            <div className="ud">
              <div className="un">{PROFILE.name.toUpperCase()}</div>
              <div className="um">
                <span className="bit">
                  <span className="fl">
                    <FlagSvg code={PROFILE.countryFlag} />
                  </span>{" "}
                  {PROFILE.country}
                </span>
                <span className="sep" />
                <span className="bit">
                  <Crest id={PROFILE.clubCrest} className="cr crest cl" style={{ width: 22, height: 22 }} />{" "}
                  {PROFILE.club}
                </span>
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

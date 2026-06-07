import type { CSSProperties, ReactNode } from "react";

import { CrestSvg, FlagSvg } from "@/components/svg";
import { VS_AWAY, VS_CENTER, VS_HOME, type VsTeam } from "@/data/match";

function TeamColumn({ team, foot }: { team: VsTeam; foot: ReactNode }) {
  return (
    <div className="team">
      <div className="country-bar">
        <span className="cn">{team.country}</span>
        <span className="flag">
          <FlagSvg code={team.flag} />
        </span>
      </div>
      <div className="team-card">
        <div className="team-name">{team.name}</div>
        <div className="crest-row">
          <span className="nav-arrow">◄</span>
          <span className="crest">
            <CrestSvg id={team.crest} />
          </span>
          <span className="nav-arrow">►</span>
        </div>
        <div className="stars" style={{ "--r": team.starFill } as CSSProperties}>
          <span className="base">★★★★★</span>
          <span className="fill">★★★★★</span>
        </div>
        <div className="stats">
          {team.stats.map((s) => (
            <div className="stat" key={s.label}>
              <span className="lab">{s.label}</span>
              <span className="val">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="team-foot">{foot}</div>
    </div>
  );
}

/** VS / team selection screen. */
export default function VsScreen() {
  return (
    <section className="screen active" data-screen="select" data-screen-label="Selección de equipos">
      <div className="bg">
        <div className="streaks" />
        <div className="vignette" />
      </div>
      <div className="side-label local">LOCAL</div>
      <div className="side-label away">VISITANTE</div>
      <div className="vs-wrap">
        <div className="vs-cols">
          <TeamColumn
            team={VS_HOME}
            foot={
              <>
                <div className="foot-label">Libertadores</div>
                <div className="lib">
                  <svg viewBox="0 0 48 48">
                    <use href="#lib-mark" />
                  </svg>
                  <div className="lt">
                    <span className="a">CONMEBOL</span>
                    <span className="b">LIBERTADORES</span>
                  </div>
                </div>
              </>
            }
          />

          <div className="center-col">
            <div className="rule" />
            <div className="fecha">{VS_CENTER.round}</div>
            <div className="datetime">
              29/4 · 21 H<sup>PER</sup> 23 H<sup>URU</sup>
            </div>
            <div className="venue">
              <div className="v1">{VS_CENTER.venue.primary}</div>
              <div className="v2">{VS_CENTER.venue.secondary}</div>
            </div>
            <div className="rule bottom" />
          </div>

          <TeamColumn team={VS_AWAY} foot={<div className="ready">LISTO</div>} />
        </div>
      </div>
      <div className="prompts">
        <div className="prompt">
          <span className="glyph cross">✕</span>
          <span>Seleccionar</span>
        </div>
        <div className="prompt">
          <span className="glyph circle">○</span>
          <span>Volver</span>
        </div>
        <div className="prompt">
          <span className="glyph tri">△</span>
          <span>Al azar</span>
        </div>
      </div>
    </section>
  );
}

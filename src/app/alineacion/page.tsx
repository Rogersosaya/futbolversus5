import { CrestSvg } from "@/components/svg";
import { LINEUP } from "@/data/match";

/** Lineup screen — formation, team stats and the on-pitch 4-3-3. */
export default function LineupScreen() {
  return (
    <section className="screen active" data-screen="lineup" data-screen-label="Alineación">
      <div className="bg">
        <div className="streaks" />
        <div className="vignette" />
      </div>
      <div className="lineup">
        <div className="lu-side">
          <div className="lu-team">
            <span className="crest">
              <CrestSvg id={LINEUP.team.crest} />
            </span>
            <div className="nm">
              <b>{LINEUP.team.name}</b>
              <small>{LINEUP.team.sub}</small>
            </div>
          </div>
          <div className="lu-form">
            <span className="f-num">{LINEUP.formation.number}</span>
            <span className="f-lab">
              FORMACIÓN
              <br />
              OFENSIVA
            </span>
          </div>
          <div className="lu-stats">
            {LINEUP.stats.map((s) => (
              <div key={s.label} className={`lu-stat${"overall" in s && s.overall ? " ovr" : ""}`}>
                <div className="l">{s.label}</div>
                <div className="v">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="lu-legend">
            <b>Instrucciones de equipo</b>
            <br />
            Presión: Alta · Ritmo: Rápido
            <br />
            Amplitud: Ancha · Línea: Adelantada
            <br />
            <br />
            <b>Capitán</b> · J. Rivera (10)
            <br />
            <b>Penales</b> · A. Valera (9)
          </div>
        </div>
        <div className="pitch-wrap">
          <div className="pitch" id="pitch">
            <div className="mid" />
            <div className="circle" />
            <div className="box top" />
            <div className="box bot" />
            <div className="box s top" />
            <div className="box s bot" />
            {LINEUP.squad.map((p) => (
              <div key={p.number} className="player" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <div className="tok">
                  {p.number}
                  <span className="rt">{p.rating}</span>
                </div>
                <div className="nm">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="prompts">
        <div className="prompt">
          <span className="glyph cross">✕</span>
          <span>Confirmar</span>
        </div>
        <div className="prompt">
          <span className="glyph circle">○</span>
          <span>Volver</span>
        </div>
        <div className="prompt">
          <span className="glyph sq">□</span>
          <span>Cambiar táctica</span>
        </div>
      </div>
    </section>
  );
}

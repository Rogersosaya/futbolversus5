import { CrestSvg } from "@/components/svg";
import { Topbar } from "@/components/Topbar";
import {
  ACTIVE_GROUP,
  FIXTURES,
  GROUP_LABEL,
  GROUPS,
  STANDINGS,
} from "@/data/standings";

/** Standings screen — group table and matchday results. */
export default function TableScreen() {
  return (
    <section className="screen active" data-screen="table" data-screen-label="Tabla de posiciones">
      <div className="bg">
        <div className="streaks" />
        <div className="vignette" />
      </div>

      <Topbar>
        <span>CONMEBOL Libertadores 2026</span>
        <span>Fase de grupos</span>
      </Topbar>

      <div className="stand">
        <div className="stand-main">
          <div className="stand-head">
            <h2>
              {GROUP_LABEL} <span>· Posiciones</span>
            </h2>
            <div className="gsel">
              {GROUPS.map((g) => (
                <div key={g} className={`g${g === ACTIVE_GROUP ? " on" : ""}`}>
                  {g}
                </div>
              ))}
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th className="team">EQUIPO</th>
                <th>PJ</th>
                <th>G</th>
                <th>E</th>
                <th>P</th>
                <th>GF</th>
                <th>GC</th>
                <th>DG</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map((r) => (
                <tr key={r.pos} className={r.me ? "me" : undefined}>
                  <td className="team">
                    <div className="tcell">
                      <span className={`qual${r.qual !== "none" ? ` ${r.qual}` : ""}`} />
                      <span className="pos">{r.pos}</span>
                      <span className="cr">
                        <CrestSvg id={r.crest} />
                      </span>
                      <b>{r.team}</b>
                    </div>
                  </td>
                  <td>{r.played}</td>
                  <td>{r.won}</td>
                  <td>{r.drawn}</td>
                  <td>{r.lost}</td>
                  <td>{r.gf}</td>
                  <td>{r.ga}</td>
                  <td>{r.gd}</td>
                  <td className="pts">
                    <b>{r.pts}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="stand-side">
          <div className="se">FECHA 3 · RESULTADOS</div>
          {FIXTURES.map((fx, i) => (
            <div key={i} className="fx">
              <div className="fx-d">{fx.status}</div>
              <div className="fx-m">
                <span className="t">
                  <span className="cr">
                    <CrestSvg id={fx.home.crest} />
                  </span>
                  {fx.home.team}
                </span>
                <span className={`sc${fx.score ? "" : " tbd"}`}>{fx.score ?? "— : —"}</span>
              </div>
              <div className="fx-m" style={{ marginTop: 12 }}>
                <span className="t">
                  <span className="cr">
                    <CrestSvg id={fx.away.crest} />
                  </span>
                  {fx.away.team}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="prompts">
        <div className="prompt">
          <span className="glyph cross">✕</span>
          <span>Ver partido</span>
        </div>
        <div className="prompt">
          <span className="glyph circle">○</span>
          <span>Volver</span>
        </div>
      </div>
    </section>
  );
}

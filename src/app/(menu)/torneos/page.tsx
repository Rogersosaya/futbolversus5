import { Sym } from "@/components/svg";
import { BRACKET_COLUMNS, PHASES, PRIZES, TOURNAMENT_META } from "@/data/tournament";

/** A single empty bracket slot with a placeholder label. */
function Slot({ label }: { label: string }) {
  return (
    <div className="br-slot">
      <span className="br-cr" />
      <span className="br-tbd">{label}</span>
    </div>
  );
}

/** A two-slot tie. */
function Tie({ label }: { label: string }) {
  return (
    <div className="br-tie">
      <Slot label={label} />
      <Slot label={label} />
    </div>
  );
}

/** Torneos view — Copa FUTBOL VERSUS overview and bracket. */
export default function TorneosPage() {
  return (
    <div className="torneos">
      <div className="section-head">
        <div>
          <h2>TORNEOS</h2>
          <div className="sh-sub">
            Compite por la gloria y por premios reales. Organizado por FUTBOL VERSUS.
          </div>
        </div>
      </div>

      <div className="trn-grid">
        <div className="trn-hero">
          <span className="liga-tag">
            <Sym id="ic-cup" /> TORNEO OFICIAL
          </span>
          <h3>COPA FUTBOL VERSUS</h3>
          <p>
            Los <b>36 clubes</b> más valiosos del Transfermarket se enfrentan por una bolsa de{" "}
            <b>$8,000</b> en premios.
          </p>
          <div className="podium-row">
            {PRIZES.map((p) => (
              <div key={p.position} className={`podium ${p.cls}`}>
                <div className="pod-amt">{p.amount}</div>
                <div className="pod-bar" style={{ height: p.height }}>
                  <span>{p.position}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="trn-meta">
            {TOURNAMENT_META.map((m) => (
              <div key={m.label} className="tm-pill">
                <span className="l">{m.label}</span>
                <span className="v">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="trn-format">
          <div className="trn-sub">FORMATO DEL TORNEO</div>
          <div className="phases">
            {PHASES.map((p) => (
              <div key={p.n} className="phase">
                <span className="ph-n">{p.n}</span>
                <span className="ph-ic">
                  <Sym id={p.ic} />
                </span>
                <div className="ph-tx">
                  <b>{p.title}</b>
                  <small>{p.desc}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="trn-note">
            Clasifican 16 clubes de la Fase de Liga. El cuadro se define al cierre de la temporada
            regular.
          </div>
        </div>
      </div>

      <div className="bracket-card">
        <div className="trn-sub">
          CUADRO FINAL <span>· por definir</span>
        </div>
        <div className="bracket">
          {BRACKET_COLUMNS.map((col) => (
            <div key={col.title} className="br-col">
              <div className="br-h">{col.title}</div>
              {Array.from({ length: col.ties }).map((_, i) => (
                <Tie key={i} label={col.label} />
              ))}
            </div>
          ))}
          <div className="br-col final">
            <div className="br-h">FINAL</div>
            <div className="br-slot champ">
              <svg width="26" height="26" viewBox="0 0 24 24">
                <use href="#ic-cup" />
              </svg>
              <span className="br-tbd">CAMPEÓN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

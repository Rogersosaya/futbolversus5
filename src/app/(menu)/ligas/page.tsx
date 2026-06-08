import Link from "next/link";

import { Sym } from "@/components/svg";
import {
  getLeagues,
  getCollectibles,
  currentLeagueIndex,
  leagueProgress,
  type CollectibleKind,
} from "@/actions/catalog";
import { getSessionProfile } from "@/actions/profile";

type StepState = "done" | "current" | "locked";

const CheckMark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 12l5 5 9-11" />
  </svg>
);

const LockMark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/** Ruta de Ligas view — sequential league progression by market value. */
export default async function LigasPage() {
  const [leagues, collectibles, session] = await Promise.all([
    getLeagues(),
    getCollectibles(),
    getSessionProfile(),
  ]);

  const value = session.profile?.clubValue ?? 0;
  const currentIdx = currentLeagueIndex(leagues, value);
  const info = leagueProgress(leagues, value);

  // Per-league unlock counts by kind.
  const counts = new Map<string, Record<CollectibleKind, number>>();
  for (const l of leagues) counts.set(l.id, { CREST: 0, AVATAR: 0, STADIUM: 0 });
  for (const c of collectibles) {
    const byKind = counts.get(c.leagueId);
    if (byKind) byKind[c.kind] += 1;
  }

  return (
    <div className="ligas">
      <div className="section-head">
        <div>
          <Link className="back-chip" href="/">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>{" "}
            Partido de Liga
          </Link>
          <h2 style={{ marginTop: 10 }}>RUTA DE LIGAS</h2>
          <div className="sh-sub">
            Sube el valor de tu club para ascender. Cada liga desbloquea nuevos escudos, avatares y
            estadios en el Mercado.
          </div>
        </div>
        <div className="lg-hud">
          <span className="lg-hud-l">VALOR DE TU CLUB</span>
          <span className="lg-hud-v" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Sym id="ic-value" width={20} height={20} /> €{info.value}M
          </span>
          {info.next && (
            <span className="lg-hud-n">
              Próxima · {info.next.name} (€{info.next.minMarketValue}M)
            </span>
          )}
        </div>
      </div>

      <div className="road">
        {leagues.map((l, i) => {
          const st: StepState = i < currentIdx ? "done" : i === currentIdx ? "current" : "locked";
          const reqTxt = i === 0 ? "LIGA INICIAL" : `DESDE €${l.minMarketValue}M DE VALOR`;
          const c = counts.get(l.id) ?? { CREST: 0, AVATAR: 0, STADIUM: 0 };

          return (
            <div key={l.id} className={`lg-step ${st}`}>
              <div className="lg-rail">
                <span className="lg-mark">
                  {st === "done" ? <CheckMark /> : st === "locked" ? <LockMark /> : <span className="lg-pulse" />}
                </span>
              </div>
              <div className={`lg-card ${st}`}>
                <div className="lg-main">
                  <span className={`lg-em ${st}`}>
                    <svg viewBox="0 0 36 24" preserveAspectRatio="xMidYMid slice">
                      <use href={`#flag-${l.countryCode}`} />
                    </svg>
                  </span>
                  <div className="lg-info">
                    <div className="lg-name">
                      {l.name} <span className="lg-tier">NIVEL {l.tier}</span>
                    </div>
                    <div className="lg-country">{l.country}</div>
                    <div className="lg-req">{reqTxt}</div>
                  </div>
                  {st === "done" ? (
                    <span className="lg-status done">COMPLETADA</span>
                  ) : st === "current" ? (
                    <span className="lg-status current">EN CURSO</span>
                  ) : (
                    <span className="lg-status locked">€{l.minMarketValue}M</span>
                  )}
                </div>
                <div className="lg-unlocks">
                  <span className="lg-unlock">
                    <Sym id="ic-shield" /> {c.CREST} escudos
                  </span>
                  <span className="lg-unlock">
                    <Sym id="ic-user" /> {c.AVATAR} avatares
                  </span>
                  <span className="lg-unlock">
                    <Sym id="ic-stadium" /> {c.STADIUM} estadios
                  </span>
                </div>
                {st === "current" && info.next && (
                  <div className="lg-prog">
                    <div className="lg-prog-bar">
                      <i style={{ width: `${info.pct}%` }} />
                    </div>
                    <div className="lg-prog-tx">
                      Te faltan <b>€{info.need}M</b> para ascender a <b>{info.next.name}</b>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

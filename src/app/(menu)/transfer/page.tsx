import { CrestArt } from "@/components/svg";
import { COUNTRY_LABEL, TRANSFER_RANKING } from "@/data/transfermarket";

/** Transfermarket view — clubs ranked by market value. */
export default function TransferPage() {
  const me = TRANSFER_RANKING.find((r) => r.me)!;

  return (
    <div className="tm">
      <div className="section-head">
        <div>
          <h2>TRANSFERMARKET</h2>
          <div className="sh-sub">
            El ranking de los clubes más valiosos. Tu valor sube con cada victoria, racha y trofeo.
          </div>
        </div>
        <div className="tm-mine">
          <span className="tm-mine-rank">#{me.pos}</span>
          <div className="tm-mine-d">
            <span className="l">TU CLUB</span>
            <span className="n">{me.club}</span>
          </div>
          <div className="tm-mine-v">
            <span className="l">VALOR</span>
            <span className="vcoin">
              <i /> {me.value}
            </span>
          </div>
        </div>
      </div>
      <div className="tm-tablewrap">
        <table className="tm-tbl">
          <thead>
            <tr>
              <th className="team">CLUB</th>
              <th className="pres">PRESIDENTE</th>
              <th>PAÍS</th>
              <th className="val">VALOR DE MERCADO</th>
            </tr>
          </thead>
          <tbody>
            {TRANSFER_RANKING.map((r) => (
              <tr key={r.pos} className={r.me ? "me" : undefined}>
                <td>
                  <div className="tcell">
                    <span className={`pos${r.pos <= 3 ? ` top${r.pos}` : ""}`}>{r.pos}</span>
                    <span className="cr">
                      <CrestArt crest={r.crest} />
                    </span>
                    <b>{r.club}</b>
                  </div>
                </td>
                <td className="pres">
                  {r.president}
                  {r.me && <span className="you">TÚ</span>}
                </td>
                <td className="ctry">{COUNTRY_LABEL[r.country]}</td>
                <td className="val">
                  <span className="vcoin">
                    <i /> {r.value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

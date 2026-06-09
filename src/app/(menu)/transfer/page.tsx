import { CrestArt } from "@/components/svg";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { Money } from "@/components/Money";
import { COUNTRY_LABEL } from "@/data/transfermarket";
import { getTransferRanking } from "@/actions/transfer";

/** Transfermarket view — clubs ranked by market value, descending. */
export default async function TransferPage() {
  const ranking = await getTransferRanking();
  const me = ranking.find((r) => r.me);

  return (
    <div className="tm">
      <div className="section-head">
        <div>
          <h2>TRANSFERMARKET</h2>
          <div className="sh-sub">
            El ranking de los clubes más valiosos. Tu valor sube con cada victoria, racha y trofeo.
          </div>
        </div>
        {me && (
          <div className="tm-mine">
            <span className="tm-mine-rank">#{me.pos}</span>
            <div className="tm-mine-d">
              <span className="l">TU CLUB</span>
              <span className="n">{me.club}</span>
            </div>
            <div className="tm-mine-v">
              <span className="l">VALOR</span>
              <Money euros={me.value} kind="value" />
            </div>
          </div>
        )}
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
            {ranking.map((r) => (
              <tr key={`${r.pos}-${r.club}`} className={r.me ? "me" : undefined}>
                <td>
                  <div className="tcell">
                    <span className={`pos${r.pos <= 3 ? ` top${r.pos}` : ""}`}>{r.pos}</span>
                    <span className="cr">
                      {r.art ? <CollectibleGlyph c={r.art} /> : r.crest ? <CrestArt crest={r.crest} /> : null}
                    </span>
                    <b>{r.club}</b>
                  </div>
                </td>
                <td className="pres">
                  {r.president}
                  {r.me && <span className="you">TÚ</span>}
                </td>
                <td className="ctry">{COUNTRY_LABEL[r.country] ?? r.country.toUpperCase()}</td>
                <td className="val">
                  <Money euros={r.value} kind="value" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

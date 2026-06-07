"use client";

import { useState } from "react";

import { CrestSvg, FlagSvg, Sym } from "@/components/svg";
import { PROFILE } from "@/data/profile";
import {
  CLUB_KPIS,
  HISTORY,
  HISTORY_FILTERS,
  RESULT_BADGE,
  type HistoryCategory,
} from "@/data/history";

type Filter = "todos" | HistoryCategory;

/** Mi Club view — club identity, KPIs and a filterable results history. */
export default function ClubPage() {
  const [filter, setFilter] = useState<Filter>("todos");
  const list = HISTORY.filter((h) => filter === "todos" || h.cat === filter);

  return (
    <div className="club">
      <div className="club-head">
        <div className="club-id">
          <span className="club-crest">
            <CrestSvg id="crest-rma" />
          </span>
          <div className="club-meta">
            <div className="club-name">REAL MADRID</div>
            <div className="club-pres">
              <span className="ua">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PROFILE.avatar} alt="" />
              </span>
              Presidente <b>{PROFILE.name}</b> ·{" "}
              <span className="fl">
                <FlagSvg code={PROFILE.countryFlag} />
              </span>{" "}
              {PROFILE.country}
            </div>
          </div>
        </div>
        <div className="club-kpis">
          {CLUB_KPIS.map((kpi) => (
            <div key={kpi.label} className="kpi">
              <span className={`kv${kpi.coin ? " vcoin" : ""}`}>
                {kpi.coin && <i />}
                {kpi.value}
              </span>
              <span className="kl">{kpi.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="club-body">
        <div className="hist-head">
          <h3>HISTORIAL DE RESULTADOS</h3>
          <div className="hist-tabs">
            {HISTORY_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`ht${filter === f.key ? " on" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="hist-list">
          {list.map((h, i) => {
            const badge = RESULT_BADGE[h.result];
            return (
              <div key={`${h.title}-${i}`} className="hrow">
                <span className={`h-ic ${h.cat}`}>
                  <Sym id={h.ic} />
                </span>
                <div className="h-tx">
                  <b>{h.title}</b>
                  <small>{h.sub}</small>
                </div>
                <span className="h-sc">{h.score}</span>
                <span className={`h-res ${badge.cls}`}>{badge.label}</span>
                <span className="h-d">{h.when}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

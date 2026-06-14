"use client";

import { useState } from "react";

import { FlagSvg, Sym } from "@/components/svg";
import { AvatarArt, ShieldArt } from "@/components/game-art";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { ClubFriends } from "@/components/ClubFriends";
import { Money, EUR_PER_MILLION } from "@/components/Money";
import { useProfile } from "@/components/ProfileContext";
import {
  CLUB_KPIS,
  HISTORY_FILTERS,
  RESULT_BADGE,
  type HistoryCategory,
  type HistoryEntry,
} from "@/data/history";

type Filter = "todos" | HistoryCategory;

/** "12 jun, 14:32" in the user's locale/timezone. */
const formatWhen = (epochMs: number) =>
  new Date(epochMs).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Mi Club view — club identity, KPIs and the played-matches history. */
export function ClubView({ history }: { history: HistoryEntry[] }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const profile = useProfile();
  const list = history.filter((h) => filter === "todos" || h.cat === filter);

  return (
    <div className="club">
      <div className="club-head">
        <div className="club-id">
          <span className="club-crest">
            {profile.shieldArt ? <CollectibleGlyph c={profile.shieldArt} /> : <ShieldArt id={profile.shieldId} />}
          </span>
          <div className="club-meta">
            <div className="club-name">MI CLUB</div>
            <div className="club-pres">
              <span className="ua club-ua">
                {profile.avatarArt ? <CollectibleGlyph c={profile.avatarArt} /> : <AvatarArt id={profile.avatarId} />}
              </span>
              Presidente <b>{profile.presidentName}</b>
              {profile.country && (
                <>
                  {" · "}
                  <span className="fl">
                    <FlagSvg code={profile.country} />
                  </span>{" "}
                  {profile.countryName}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="club-kpis">
          {CLUB_KPIS.map((kpi) => (
            <div key={kpi.label} className="kpi">
              <span className="kv">
                {kpi.coin ? (
                  <Money euros={profile.clubValue * EUR_PER_MILLION} kind="value" size="lg" />
                ) : (
                  kpi.value
                )}
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
          {list.length === 0 && (
            <div className="hist-empty">Aún no tienes partidas aquí.</div>
          )}
          {list.map((h) => {
            const badge = RESULT_BADGE[h.result];
            return (
              <div key={h.id} className="hrow">
                <span className={`h-ic ${h.cat}`}>
                  <Sym id={h.ic} />
                </span>
                <div className="h-tx">
                  <b>{h.title}</b>
                  <small>{h.sub}</small>
                </div>
                <span className="h-sc">{h.score}</span>
                <span className={`h-res ${badge.cls}`}>{badge.label}</span>
                <span className="h-d">{formatWhen(h.finishedAt)}</span>
              </div>
            );
          })}
        </div>

        <ClubFriends />
      </div>
    </div>
  );
}

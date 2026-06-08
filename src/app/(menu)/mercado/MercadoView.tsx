"use client";

import { useMemo, useState } from "react";

import { FlagSvg, Sym } from "@/components/svg";
import { CollectibleArt } from "@/components/CollectibleArt";
import type { Collectible, CollectibleKind, Rarity } from "@/actions/catalog";

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 12l5 5 9-11" />
  </svg>
);

const LockIcon = ({ strokeWidth = 2 }: { strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const TABS: { key: CollectibleKind; ic: string; label: string }[] = [
  { key: "CREST", ic: "ic-shield", label: "ESCUDOS" },
  { key: "AVATAR", ic: "ic-user", label: "AVATARES" },
  { key: "STADIUM", ic: "ic-stadium", label: "ESTADIOS" },
];

const RARITY_LABEL: Partial<Record<Rarity, string>> = {
  LEGEND: "LEYENDA",
  EPIC: "ÉPICO",
  RARE: "RARO",
};

const RARITY_CLASS: Partial<Record<Rarity, string>> = {
  LEGEND: "legend",
  EPIC: "epic",
  RARE: "rare",
};

export function MercadoView({
  items,
  currentTier,
  ownedIds,
}: {
  items: Collectible[];
  currentTier: number;
  ownedIds: string[];
}) {
  const [tab, setTab] = useState<CollectibleKind>("CREST");
  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);
  const visible = useMemo(() => items.filter((it) => it.kind === tab), [items, tab]);

  const renderItem = (it: Collectible) => {
    const isOwned = owned.has(it.id);
    const locked = !isOwned && it.leagueTier > currentTier;
    const rareClass = RARITY_CLASS[it.rarity];
    const rareLabel = RARITY_LABEL[it.rarity];

    return (
      <div
        key={it.id}
        className={`store-item${isOwned ? " owned" : ""}${locked ? " locked" : ""}`}
      >
        {rareClass && rareLabel && <span className={`badge-rare ${rareClass}`}>{rareLabel}</span>}
        <CollectibleArt c={it} />
        {locked && (
          <div className="si-lock">
            <LockIcon />
            <span className="ll">SE DESBLOQUEA EN</span>
            <span className="lf">
              <span className="fl">
                <FlagSvg code={it.leagueCountryCode} slice />
              </span>
              {it.leagueName}
            </span>
          </div>
        )}
        <div className="si-body">
          <div className="sn">{it.name}</div>
          <div className="sm">
            {it.leagueName} · {it.leagueCountry}
          </div>
          <div className="si-buy">
            <div className="si-price">
              <i /> {it.price.toLocaleString("es")}
            </div>
            {isOwned ? (
              <button className="si-btn owned">
                <CheckIcon />
                TUYO
              </button>
            ) : locked ? (
              <button className="si-btn lock">
                <LockIcon strokeWidth={2.4} />
                BLOQUEADO
              </button>
            ) : (
              <button className="si-btn">COMPRAR</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mercado">
      <div className="section-head">
        <div>
          <h2>MERCADO</h2>
          <div className="sh-sub">
            Gasta tus monedas en escudos, avatares y estadios para personalizar tu carrera.
          </div>
        </div>
      </div>
      <div className="store-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`store-tab${tab === t.key ? " on" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <Sym id={t.ic} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="store-grid">{visible.map(renderItem)}</div>
    </div>
  );
}

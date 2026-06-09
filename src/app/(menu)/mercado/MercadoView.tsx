"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FlagSvg, Sym } from "@/components/svg";
import { CollectibleArt } from "@/components/CollectibleArt";
import { Money, EUR_PER_MILLION } from "@/components/Money";
import { buyCollectible } from "@/app/actions/mercado";
import type { Collectible, CollectibleKind, Rarity } from "@/actions/catalog";

const PAGE_SIZE = 8;

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

const ChevronIcon = ({ dir }: { dir: "left" | "right" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    {dir === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
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
  funds,
}: {
  items: Collectible[];
  currentTier: number;
  ownedIds: string[];
  funds: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<CollectibleKind>("CREST");
  const [page, setPage] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);

  const visible = useMemo(() => items.filter((it) => it.kind === tab), [items, tab]);
  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  const pageItems = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const switchTab = (next: CollectibleKind) => {
    setTab(next);
    setPage(0);
  };

  const buy = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      await buyCollectible(id);
      router.refresh();
      setPendingId(null);
    });
  };

  const renderItem = (it: Collectible) => {
    const isOwned = owned.has(it.id);
    const locked = !isOwned && it.leagueTier > currentTier;
    const affordable = funds >= it.price;
    const buying = isPending && pendingId === it.id;
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
            <Money euros={it.price * EUR_PER_MILLION} kind="funds" size="sm" />
            {isOwned ? (
              <button className="si-btn owned">
                <CheckIcon /> TUYO
              </button>
            ) : locked ? (
              <button className="si-btn lock">
                <LockIcon strokeWidth={2.4} /> BLOQUEADO
              </button>
            ) : !affordable ? (
              <button className="si-btn lock" disabled>
                SIN FONDOS
              </button>
            ) : (
              <button className="si-btn" onClick={() => buy(it.id)} disabled={buying}>
                {buying ? "..." : "COMPRAR"}
              </button>
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
            Gasta los fondos de tu club en escudos, avatares y estadios para personalizar tu carrera.
          </div>
        </div>
        <div className="mk-funds">
          <span className="mk-funds-l">FONDOS DEL CLUB</span>
          <Money euros={funds * EUR_PER_MILLION} kind="funds" size="lg" />
        </div>
      </div>

      <div className="store-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`store-tab${tab === t.key ? " on" : ""}`}
            onClick={() => switchTab(t.key)}
          >
            <Sym id={t.ic} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="store-grid">{pageItems.map(renderItem)}</div>

      {totalPages > 1 && (
        <div className="store-pagination">
          <button
            className="sp-btn"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            <ChevronIcon dir="left" />
          </button>

          <div className="sp-dots">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`sp-dot${i === page ? " on" : ""}`}
                onClick={() => setPage(i)}
              />
            ))}
          </div>

          <span className="sp-label">
            {page + 1} <span>/ {totalPages}</span>
          </span>

          <button
            className="sp-btn"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
          >
            <ChevronIcon dir="right" />
          </button>
        </div>
      )}
    </div>
  );
}

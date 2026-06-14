"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FlagSvg, Sym } from "@/components/svg";
import { CollectibleArt } from "@/components/CollectibleArt";
import { Money, EUR_PER_MILLION } from "@/components/Money";
import type { Collectible, CollectibleKind, Rarity } from "@/actions/catalog";

type Groups = Record<CollectibleKind, Collectible[]>;

const KINDS: { key: CollectibleKind; ic: string; label: string; title: string }[] = [
  { key: "CREST", ic: "ic-shield", label: "escudos", title: "Escudos" },
  { key: "AVATAR", ic: "ic-user", label: "avatares", title: "Avatares" },
  { key: "STADIUM", ic: "ic-stadium", label: "estadios", title: "Estadios" },
];

const RARITY: Partial<Record<Rarity, { label: string; cls: string }>> = {
  LEGEND: { label: "LEYENDA", cls: "legend" },
  EPIC: { label: "ÉPICO", cls: "epic" },
  RARE: { label: "RARO", cls: "rare" },
};

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/** A collectible's cost in funds, or an "Inicial" tag when it is free. */
const Price = ({ amount }: { amount: number }) =>
  amount > 0 ? (
    <Money euros={amount * EUR_PER_MILLION} kind="funds" size="sm" />
  ) : (
    <span className="cm-price free">Inicial</span>
  );

/**
 * The unlock row on each league card. Each kind (escudos / avatares / estadios)
 * is a button that opens a viewer modal listing that league's collectibles of
 * that kind, with their rarity and market value.
 */
export function LeagueUnlocks({
  leagueName,
  leagueCountry,
  countryCode,
  groups,
}: {
  leagueName: string;
  leagueCountry: string;
  countryCode: string;
  groups: Groups;
}) {
  const [openKind, setOpenKind] = useState<CollectibleKind | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => setOpenKind(null), []);

  useEffect(() => {
    if (!openKind) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    closeBtn.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [openKind, close]);

  const active = KINDS.find((k) => k.key === openKind);
  const items = openKind ? groups[openKind] : [];

  return (
    <>
      <div className="lg-unlocks">
        {KINDS.map((k) => {
          const n = groups[k.key].length;
          return (
            <button
              key={k.key}
              type="button"
              className="lg-unlock"
              onClick={() => setOpenKind(k.key)}
              disabled={n === 0}
              aria-haspopup="dialog"
            >
              <Sym id={k.ic} />
              <span className="lg-unlock-tx">
                <b>{n}</b> {k.label}
              </span>
              <span className="lg-unlock-go" aria-hidden="true">
                <ChevronIcon />
              </span>
            </button>
          );
        })}
      </div>

      {active &&
        createPortal(
          <div
            className="cm-layer"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
          <div className="cm-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className="cm-head">
              <span className="cm-flag">
                <FlagSvg code={countryCode} slice />
              </span>
              <div className="cm-head-tx">
                <h3 id={titleId}>
                  {active.title} de {leagueName}
                </h3>
                <p>
                  {items.length} {items.length === 1 ? "disponible" : "disponibles"} · {leagueCountry}
                </p>
              </div>
              <button ref={closeBtn} className="cm-close" onClick={close} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </header>

            <div className="cm-grid">
              {items.map((it) => {
                const r = RARITY[it.rarity];
                return (
                  <div key={it.id} className="cm-item">
                    {r && <span className={`badge-rare ${r.cls}`}>{r.label}</span>}
                    <CollectibleArt c={it} />
                    <div className="cm-item-body">
                      <span className="cm-name">{it.name}</span>
                      <Price amount={it.price} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

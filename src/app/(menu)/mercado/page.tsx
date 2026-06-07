"use client";

import { useState, type CSSProperties } from "react";

import { CrestSvg, FlagSvg, Sym } from "@/components/svg";
import { LEAGUES, currentLeagueIndex, findLeague } from "@/data/leagues";
import {
  RARITY_LABEL,
  STORE,
  STORE_TABS,
  type StoreArt,
  type StoreItem,
  type StoreTab,
} from "@/data/store";

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

function StoreArtView({ art }: { art: StoreArt }) {
  switch (art.kind) {
    case "image":
      return (
        <div className="si-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art.src} alt="" />
        </div>
      );
    case "crest":
      return (
        <div className="si-art" style={{ background: "radial-gradient(circle at 50% 35%,#1a2030,#0c1018)" }}>
          <span className="crest">
            <CrestSvg id={art.id} />
          </span>
        </div>
      );
    case "avatar":
      return (
        <div className="si-art" style={{ background: "radial-gradient(circle at 50% 30%,#26303f,#0e131c)" }}>
          <span className="avwrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/messi-avatar.png" alt="" />
          </span>
        </div>
      );
    case "stadium":
      return (
        <div
          className="si-art"
          style={{ background: `linear-gradient(150deg,${art.gradient[0]},${art.gradient[1]})` } as CSSProperties}
        >
          <span className="crest" style={{ color: "#fff", opacity: 0.85 }}>
            <svg viewBox="0 0 24 24" width="76" height="76">
              <use href="#ic-stadium" />
            </svg>
          </span>
        </div>
      );
  }
}

/** Mercado view — buy clubs, avatars and stadiums; gated by league progress. */
export default function MercadoPage() {
  const [tab, setTab] = useState<StoreTab>("club");
  const currentIdx = currentLeagueIndex();
  const leagueIndex = (id?: string) => LEAGUES.findIndex((l) => l.id === id);

  const renderItem = (it: StoreItem, i: number) => {
    const locked = !it.owned && it.lg ? leagueIndex(it.lg) > currentIdx : false;
    const league = findLeague(it.lg ?? "");

    return (
      <div key={`${it.name}-${i}`} className={`store-item${it.owned ? " owned" : ""}${locked ? " locked" : ""}`}>
        {it.rare && <span className={`badge-rare ${it.rare}`}>{RARITY_LABEL[it.rare]}</span>}
        <StoreArtView art={it.art} />
        {locked && league && (
          <div className="si-lock">
            <LockIcon />
            <span className="ll">SE DESBLOQUEA EN</span>
            <span className="lf">
              <span className="fl">
                <FlagSvg code={league.flag} slice />
              </span>
              {league.name}
            </span>
          </div>
        )}
        <div className="si-body">
          <div className="sn">{it.name}</div>
          <div className="sm">{it.meta}</div>
          <div className="si-buy">
            <div className="si-price">
              <i /> {it.price}
            </div>
            {it.owned ? (
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
            Gasta tus monedas en clubes, avatares y estadios para personalizar tu carrera.
          </div>
        </div>
      </div>
      <div className="store-tabs">
        {STORE_TABS.map((t) => (
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
      <div className="store-grid">{STORE[tab].map(renderItem)}</div>
    </div>
  );
}

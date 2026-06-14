"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateProfile } from "@/app/actions/auth";
import { COUNTRIES } from "@/data/game-assets";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import type { Collectible } from "@/actions/catalog";

/* ─── Step meta ─── */

const STEPS = ["identity", "avatar", "stadium", "shield"] as const;
type Step = (typeof STEPS)[number];

const STEP_META: Record<Step, { title: string; sub: string; label: string }> = {
  identity: {
    title: "¿QUIÉN ERES?",
    sub: "El nombre con el que te conocerá el mundo del fútbol.",
    label: "IDENTIDAD",
  },
  avatar: {
    title: "TU IMAGEN",
    sub: "El mundo te verá así. Elige quién quieres ser.",
    label: "IMAGEN",
  },
  stadium: {
    title: "TU ESTADIO",
    sub: "Aquí rugirá tu afición. El fortín donde todo empieza.",
    label: "ESTADIO",
  },
  shield: {
    title: "TU ESCUDO",
    sub: "El símbolo de tu club. Tu identidad en cada partido.",
    label: "ESCUDO",
  },
};

/* ─── Generic collectible picker ─── */

function CollectiblePicker({
  options,
  selected,
  onSelect,
  ariaLabel,
}: {
  options: Collectible[];
  selected: string | null;
  onSelect: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="sel-grid" role="group" aria-label={ariaLabel}>
      {options.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`sel-tile${selected === c.id ? " sel" : ""}`}
          onClick={() => onSelect(c.id)}
          aria-pressed={selected === c.id}
        >
          <div className="sel-art">
            <CollectibleGlyph c={c} />
          </div>
          <div className="sel-info">
            <div className="sel-name">{c.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function StepIdentity({
  name,
  setName,
  country,
  setCountry,
}: {
  name: string;
  setName: (v: string) => void;
  country: string | null;
  setCountry: (v: string) => void;
}) {
  return (
    <>
      <div className="psu-field">
        <label className="psu-label" htmlFor="psu-name">
          NOMBRE DEL PRESIDENTE
        </label>
        <input
          id="psu-name"
          type="text"
          className="psu-input"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="off"
        />
      </div>

      <div className="psu-field">
        <span className="psu-label">TU PAÍS</span>
        <div className="country-grid" role="group" aria-label="Selecciona tu país">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`country-btn${country === c.code ? " sel" : ""}`}
              onClick={() => setCountry(c.code)}
              aria-pressed={country === c.code}
            >
              <span className="cf" aria-hidden="true">
                {c.flag}
              </span>
              <span className="cn">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Main modal ─── */

export interface SetupOptions {
  avatars: Collectible[];
  stadiums: Collectible[];
  shields: Collectible[];
}

export function ProfileSetupModal({
  userId,
  options,
}: {
  userId: string;
  options: SetupOptions;
}) {
  void userId; // passed for context; auth action re-derives user from cookies
  const router = useRouter();
  const [step, setStep] = useState<Step>("identity");
  const [name, setName] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [stadium, setStadium] = useState<string | null>(null);
  const [shield, setShield] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const meta = STEP_META[step];

  const canNext =
    step === "identity"
      ? name.trim().length >= 2 && country !== null
      : step === "avatar"
      ? avatar !== null
      : step === "stadium"
      ? stadium !== null
      : shield !== null;

  function next() {
    const nxt = STEPS[stepIndex + 1];
    if (nxt) setStep(nxt);
  }

  function back() {
    const prv = STEPS[stepIndex - 1];
    if (prv) setStep(prv);
  }

  /** The persisted profile value for a collectible is its id. */
  const valueOf = (list: Collectible[], id: string | null) => {
    const c = list.find((o) => o.id === id);
    return c?.id ?? null;
  };

  function handleConfirm() {
    const avatarId = valueOf(options.avatars, avatar);
    const stadiumId = valueOf(options.stadiums, stadium);
    const shieldId = valueOf(options.shields, shield);
    if (!name || !country || !avatarId || !stadiumId || !shieldId) return;
    startTransition(async () => {
      await updateProfile({
        presidentName: name.trim(),
        country,
        avatarId,
        stadiumId,
        shieldId,
      });
      setDone(true);
      router.refresh();
    });
  }

  if (done) return null;

  return (
    <div className="psu-layer" role="dialog" aria-modal="true" aria-label="Configura tu perfil">
      <div className="psu-bg">
        <div className="streaks" />
        <div className="vignette" />
      </div>

      <div className="psu-inner">
        <div className="psu-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="psu-steps-row" aria-hidden="true">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`psu-step-dot${s === step ? " on" : ""}${i < stepIndex ? " done" : ""}`}
                />
              ))}
            </div>
            <span className="psu-step-label">
              {stepIndex + 1} / {STEPS.length}
            </span>
          </div>
          <div>
            <div className="psu-step-title">{meta.title}</div>
            <div className="psu-step-sub">{meta.sub}</div>
          </div>
        </div>

        <div className="psu-body">
          {step === "identity" && (
            <StepIdentity name={name} setName={setName} country={country} setCountry={setCountry} />
          )}
          {step === "avatar" && (
            <CollectiblePicker
              options={options.avatars}
              selected={avatar}
              onSelect={setAvatar}
              ariaLabel="Elige tu avatar"
            />
          )}
          {step === "stadium" && (
            <CollectiblePicker
              options={options.stadiums}
              selected={stadium}
              onSelect={setStadium}
              ariaLabel="Elige tu estadio"
            />
          )}
          {step === "shield" && (
            <CollectiblePicker
              options={options.shields}
              selected={shield}
              onSelect={setShield}
              ariaLabel="Elige tu escudo"
            />
          )}
        </div>

        <div className="psu-nav">
          {stepIndex > 0 && (
            <button type="button" className="psu-btn-back" onClick={back} disabled={isPending}>
              ← ATRÁS
            </button>
          )}
          <div className="psu-spacer" />
          {step !== "shield" ? (
            <button type="button" className="psu-btn-next" onClick={next} disabled={!canNext}>
              SIGUIENTE →
            </button>
          ) : (
            <button
              type="button"
              className="psu-btn-confirm"
              onClick={handleConfirm}
              disabled={!canNext || isPending}
            >
              {isPending ? "GUARDANDO..." : "CONFIRMAR"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

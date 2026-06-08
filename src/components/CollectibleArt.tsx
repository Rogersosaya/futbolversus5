/**
 * Renders the artwork for a collectible (escudo / avatar / estadio) from its
 * DB fields. `CollectibleGlyph` is the bare art; `CollectibleArt` wraps it in
 * the `.si-art` store tile with the right background. Both are server-safe.
 */
import type { CSSProperties } from "react";

import { CrestSvg, type CrestId } from "@/components/svg";
import { AvatarArt, ShieldArt, StadiumArt } from "@/components/game-art";

/** Shield-shape templates rendered by {@link ShieldArt} (vs bespoke crest symbols). */
const SHIELD_TEMPLATES = new Set(["clasico", "circulo", "angular"]);

export interface CollectibleArtData {
  kind: "CREST" | "AVATAR" | "STADIUM";
  artKey: string | null;
  imageUrl: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
}

/** Bare art glyph — no surrounding tile or background. */
export function CollectibleGlyph({ c }: { c: CollectibleArtData }) {
  if (c.imageUrl) {
    /* eslint-disable-next-line @next/next/no-img-element */
    const img = <img src={c.imageUrl} alt="" />;
    return c.kind === "AVATAR" ? <span className="avwrap">{img}</span> : img;
  }

  if (c.kind === "CREST") {
    if (c.artKey && SHIELD_TEMPLATES.has(c.artKey)) return <ShieldArt id={c.artKey} />;
    if (c.artKey) {
      return (
        <span className="crest">
          <CrestSvg id={c.artKey as CrestId} />
        </span>
      );
    }
    return <ShieldArt id="clasico" />;
  }

  if (c.kind === "AVATAR") return <AvatarArt id={c.artKey} />;

  // STADIUM
  if (c.artKey) return <StadiumArt id={c.artKey} />;
  return (
    <span className="crest" style={{ color: "#fff", opacity: 0.85 }}>
      <svg viewBox="0 0 24 24" width="76" height="76">
        <use href="#ic-stadium" />
      </svg>
    </span>
  );
}

/** Store-tile art: a `.si-art` box with a kind-appropriate background. */
export function CollectibleArt({ c }: { c: CollectibleArtData }) {
  let background: string | undefined;
  if (!c.imageUrl) {
    if (c.kind === "CREST") {
      background = "radial-gradient(circle at 50% 35%,#1a2030,#0c1018)";
    } else if (c.kind === "AVATAR") {
      background = "radial-gradient(circle at 50% 30%,#26303f,#0e131c)";
    } else if (c.kind === "STADIUM" && c.gradientFrom && c.gradientTo && !c.artKey) {
      background = `linear-gradient(150deg,${c.gradientFrom},${c.gradientTo})`;
    }
  }

  return (
    <div className="si-art" style={background ? ({ background } as CSSProperties) : undefined}>
      <CollectibleGlyph c={c} />
    </div>
  );
}

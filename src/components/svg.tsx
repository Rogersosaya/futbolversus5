/**
 * Low-level SVG building blocks shared across screens.
 *
 * All artwork is referenced from the symbol sheet in <SvgSymbols />. These
 * helpers keep the markup declarative instead of hand-writing `<use>` tags.
 */
import type { CSSProperties } from "react";

/**
 * A crest reference: either a predefined symbol or a generated initials shield.
 * Lets data describe "draw Boca's crest" without importing components.
 */
export type CrestRef =
  | { kind: "symbol"; id: CrestId }
  | { kind: "mini"; initials: string; fill: string; stroke: string; text?: string };

/** Crest symbol ids and their authored viewBox (round vs shield). */
const CREST_VIEWBOX: Record<string, string> = {
  "crest-uni": "0 0 100 100",
  "crest-rma": "0 0 100 100",
  "crest-nac": "0 0 100 112",
  "crest-flu": "0 0 100 112",
  "crest-col": "0 0 100 112",
};

export type CrestId = keyof typeof CREST_VIEWBOX;

/** A crest drawn from a predefined symbol, wrapped in the `.crest` span. */
export function Crest({
  id,
  className = "crest",
  style,
}: {
  id: CrestId;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={className} style={style}>
      <svg viewBox={CREST_VIEWBOX[id]}>
        <use href={`#${id}`} />
      </svg>
    </span>
  );
}

/** Bare crest svg (no wrapper) — for tables/cells that supply their own span. */
export function CrestSvg({ id }: { id: CrestId }) {
  return (
    <svg viewBox={CREST_VIEWBOX[id]}>
      <use href={`#${id}`} />
    </svg>
  );
}

/** A flag svg (no wrapper). Callers add the surrounding span/class. */
export function FlagSvg({
  code,
  slice = false,
}: {
  code: string;
  slice?: boolean;
}) {
  return (
    <svg viewBox="0 0 36 24" preserveAspectRatio={slice ? "xMidYMid slice" : undefined}>
      <use href={`#flag-${code}`} />
    </svg>
  );
}

/** An icon glyph from the `ic-*` symbols. */
export function Icon({
  id,
  width,
  height,
  className,
}: {
  id: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg width={width} height={height} className={className} viewBox="0 0 24 24">
      <use href={`#ic-${id}`} />
    </svg>
  );
}

/** Generic <use> svg for ad-hoc symbol references with a custom viewBox. */
export function Sym({
  id,
  viewBox = "0 0 24 24",
  width,
  height,
}: {
  id: string;
  viewBox?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg viewBox={viewBox} width={width} height={height}>
      <use href={`#${id}`} />
    </svg>
  );
}

/** Renders a {@link CrestRef} as either a symbol or a generated mini crest. */
export function CrestArt({ crest, fontSize }: { crest: CrestRef; fontSize?: number }) {
  if (crest.kind === "symbol") return <CrestSvg id={crest.id} />;
  return (
    <MiniCrest
      initials={crest.initials}
      fill={crest.fill}
      stroke={crest.stroke}
      text={crest.text}
      fontSize={fontSize}
    />
  );
}

/**
 * A generated shield crest with team initials, for clubs without a bespoke
 * symbol. Mirrors the original `mini()` helper.
 */
export function MiniCrest({
  initials,
  fill,
  stroke,
  text = "#fff",
  fontSize = 40,
}: {
  initials: string;
  fill: string;
  stroke: string;
  text?: string;
  fontSize?: number;
}) {
  return (
    <svg viewBox="0 0 100 112">
      <path d="M8 8 H92 V58 Q92 92 50 108 Q8 92 8 58 Z" fill={fill} />
      <path
        d="M8 8 H92 V58 Q92 92 50 108 Q8 92 8 58 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="5"
      />
      <text
        x="50"
        y="66"
        style={{ fontFamily: "var(--font-d), sans-serif" }}
        fontWeight="800"
        fontSize={fontSize}
        fill={text}
        textAnchor="middle"
        letterSpacing="1"
      >
        {initials}
      </text>
    </svg>
  );
}

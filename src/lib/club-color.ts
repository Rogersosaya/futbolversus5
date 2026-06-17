import type { CSSProperties } from "react";

/** Brand gold — the accent for clubless / colorless players. */
const GOLD = "#e8cf8e";
const HEX_RE = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

/** WCAG relative luminance (0 = black, 1 = white). */
const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const toHex = (v: number) => v.toString(16).padStart(2, "0");

/** Lighten toward white by `t` (0–1) — rescues near-black club colors that would
 * otherwise vanish against the dark lobby surface. */
const mixWhite = (hex: string, t: number) => {
  const { r, g, b } = hexToRgb(hex);
  const m = (v: number) => Math.round(v + (255 - v) * t);
  return `#${toHex(m(r))}${toHex(m(g))}${toHex(m(b))}`;
};

const rgba = (hex: string, a: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/**
 * CSS custom properties themed by a club's 1–2 representative colors, for the
 * lobby player card:
 * - `--ring`: the raw club identity — a solid color, or a HARD half-and-half
 *   split (no gradient blend) when the club has two colors.
 * - `--accent`: the primary color guaranteed legible (lifted off near-black)
 *   for the avatar border and the PRESIDENTE label.
 * - `--glow`: kept transparent — representative colors carry NO glow.
 * - `--tint`: translucent derivative for the card's surface wash.
 * Falls back to brand gold when the club has no colors set.
 */
export function clubCardVars(colors: string[] | undefined): CSSProperties {
  const cs = (colors ?? []).filter((c) => HEX_RE.test(c));
  const c1 = cs[0] ?? GOLD;
  const c2 = cs[1] ?? c1;
  const accent = luminance(c1) < 0.16 ? mixWhite(c1, 0.5) : c1;
  return {
    // Two colors → crisp half/half (hard stop at 50%); one color → solid.
    "--ring": cs.length >= 2 ? `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` : c1,
    "--accent": accent,
    "--glow": "transparent",
    "--tint": rgba(c1, 0.2),
  } as CSSProperties;
}

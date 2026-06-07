/**
 * Shared SVG <symbol> definitions for FUTBOL VERSUS.
 *
 * Rendered once (hidden) at the top of <body>. Every crest, flag and icon in
 * the app is drawn with `<use href="#id" />`, so this is the single source of
 * truth for the artwork — identical to the original design's inline <defs>.
 *
 * Crest <text> uses an inline `fontFamily` style (not a presentation
 * attribute) so that cloned `<use>` instances resolve the `--font-d` variable
 * provided by next/font instead of falling back to a system font.
 */
const crestFont = { fontFamily: "var(--font-d), sans-serif" } as const;

export function SvgSymbols() {
  return (
    <svg id="fv-defs" width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {/* Universitario crest (homage) */}
        <symbol id="crest-uni" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="49" fill="#0e1118" />
          <circle cx="50" cy="50" r="45" fill="#a4172c" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#ece1c6" strokeWidth="2.5" />
          <text x="50" y="72" style={crestFont} fontWeight="800" fontSize="74" fill="#efe6cf" textAnchor="middle">U</text>
        </symbol>

        {/* Nacional crest (homage tricolor shield) */}
        <symbol id="crest-nac" viewBox="0 0 100 112">
          <path d="M8 8 H92 V58 Q92 92 50 108 Q8 92 8 58 Z" fill="#0e3a8c" />
          <path d="M8 8 H92 V58 Q92 92 50 108 Q8 92 8 58 Z" fill="none" stroke="#dfe6f2" strokeWidth="3" />
          <path d="M16 16 H84 V57 Q84 84 50 98 Q16 84 16 57 Z" fill="#f3f5fa" />
          <rect x="16" y="16" width="68" height="13" fill="#c8102e" />
          <rect x="16" y="44" width="68" height="20" fill="#0e3a8c" />
          <text x="50" y="59" style={crestFont} fontWeight="700" fontSize="15" fill="#f3f5fa" textAnchor="middle" letterSpacing="0.5">C.N. de F.</text>
          <text x="50" y="82" style={crestFont} fontWeight="700" fontSize="13" fill="#0e3a8c" textAnchor="middle" letterSpacing="1">1899</text>
        </symbol>

        {/* generic crests for table */}
        <symbol id="crest-flu" viewBox="0 0 100 112">
          <path d="M8 8 H92 V58 Q92 92 50 108 Q8 92 8 58 Z" fill="#6c1d2b" />
          <path d="M8 8 H92 V58 Q92 92 50 108 Q8 92 8 58 Z" fill="none" stroke="#cdb98f" strokeWidth="3" />
          <path d="M30 22 L70 22 L50 92 Z" fill="#2c7a4a" />
          <circle cx="50" cy="46" r="14" fill="#f0e6cf" />
        </symbol>
        <symbol id="crest-col" viewBox="0 0 100 112">
          <path d="M8 8 H92 V58 Q92 92 50 108 Q8 92 8 58 Z" fill="#0d0d10" />
          <path d="M8 8 H92 V58 Q92 92 50 108 Q8 92 8 58 Z" fill="none" stroke="#ffffff" strokeWidth="3" />
          <rect x="20" y="20" width="13" height="68" fill="#fff" />
          <rect x="44" y="20" width="13" height="68" fill="#fff" />
          <rect x="68" y="20" width="13" height="56" fill="#fff" />
        </symbol>

        {/* flags */}
        <symbol id="flag-pe" viewBox="0 0 36 24"><rect width="12" height="24" fill="#d91023" /><rect x="12" width="12" height="24" fill="#fff" /><rect x="24" width="12" height="24" fill="#d91023" /></symbol>
        <symbol id="flag-ar" viewBox="0 0 36 24"><rect width="36" height="24" fill="#75AADB" /><rect y="8" width="36" height="8" fill="#fff" /><circle cx="18" cy="12" r="2.6" fill="#FCBF49" /></symbol>
        <symbol id="flag-br" viewBox="0 0 36 24"><rect width="36" height="24" fill="#009b3a" /><path d="M18 3.5 32.5 12 18 20.5 3.5 12Z" fill="#FFDF00" /><circle cx="18" cy="12" r="4.6" fill="#002776" /></symbol>
        <symbol id="flag-fr" viewBox="0 0 36 24"><rect width="12" height="24" fill="#0055A4" /><rect x="12" width="12" height="24" fill="#fff" /><rect x="24" width="12" height="24" fill="#EF4135" /></symbol>
        <symbol id="flag-it" viewBox="0 0 36 24"><rect width="12" height="24" fill="#009246" /><rect x="12" width="12" height="24" fill="#fff" /><rect x="24" width="12" height="24" fill="#CE2B37" /></symbol>
        <symbol id="flag-de" viewBox="0 0 36 24"><rect width="36" height="8" fill="#0b0b0b" /><rect y="8" width="36" height="8" fill="#DD0000" /><rect y="16" width="36" height="8" fill="#FFCE00" /></symbol>
        <symbol id="flag-es" viewBox="0 0 36 24"><rect width="36" height="24" fill="#AA151B" /><rect y="6" width="36" height="12" fill="#F1BF00" /></symbol>
        <symbol id="flag-gb" viewBox="0 0 36 24"><rect width="36" height="24" fill="#fff" /><rect x="15" width="6" height="24" fill="#CE1124" /><rect y="9" width="36" height="6" fill="#CE1124" /></symbol>
        <symbol id="flag-uy" viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#fff" />
          <rect y="5.33" width="36" height="2.66" fill="#0038a8" />
          <rect y="10.66" width="36" height="2.66" fill="#0038a8" />
          <rect y="16" width="36" height="2.66" fill="#0038a8" />
          <rect y="21.33" width="36" height="2.66" fill="#0038a8" />
          <rect width="16" height="13.33" fill="#fff" />
          <circle cx="8" cy="6.66" r="3.1" fill="#fcd116" />
          <circle cx="8" cy="6.66" r="1.8" fill="#fcd116" stroke="#7a5901" strokeWidth=".3" />
        </symbol>
        <symbol id="flag-nl" viewBox="0 0 36 24"><rect width="36" height="24" fill="#21468B" /><rect width="36" height="16" fill="#fff" /><rect width="36" height="8" fill="#AE1C28" /></symbol>
        <symbol id="flag-be" viewBox="0 0 36 24"><rect width="12" height="24" fill="#0b0b0b" /><rect x="12" width="12" height="24" fill="#FAE042" /><rect x="24" width="12" height="24" fill="#ED2939" /></symbol>
        <symbol id="flag-pt" viewBox="0 0 36 24"><rect width="36" height="24" fill="#FF0000" /><rect width="15" height="24" fill="#006600" /><circle cx="15" cy="12" r="3.6" fill="#FFD500" /><circle cx="15" cy="12" r="2.2" fill="#fff" /></symbol>
        <symbol id="flag-hr" viewBox="0 0 36 24"><rect width="36" height="8" fill="#FF0000" /><rect y="8" width="36" height="8" fill="#fff" /><rect y="16" width="36" height="8" fill="#171796" /><g><rect x="15" y="7" width="3" height="3" fill="#FF0000" /><rect x="18" y="7" width="3" height="3" fill="#fff" /><rect x="15" y="10" width="3" height="3" fill="#fff" /><rect x="18" y="10" width="3" height="3" fill="#FF0000" /></g></symbol>

        {/* libertadores mark (homage star/cup) */}
        <symbol id="lib-mark" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="none" stroke="#5a626f" strokeWidth="2" />
          <path d="M24 9 l3.4 7 7.6 1.1 -5.5 5.4 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.4 7.6 -1.1 Z" fill="#9aa3b2" />
          <rect x="20" y="33" width="8" height="3" rx="1" fill="#9aa3b2" />
        </symbol>

        {/* menu glyphs */}
        <symbol id="ic-ball" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 7l3.5 2.5-1.3 4h-4.4l-1.3-4z" /><path d="M12 7V4M15.5 9.5l2.8-1M14.2 13.5l1.8 2.4M9.8 13.5l-1.8 2.4M8.5 9.5l-2.8-1" /></symbol>
        <symbol id="ic-cup" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /><path d="M12 13v4M9 20h6M10 17h4" /></symbol>
        <symbol id="ic-table" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 4v16" /></symbol>
        <symbol id="ic-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="M12 8v6M9 11h6" /></symbol>
        <symbol id="ic-whistle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 9h6v4a6 6 0 1 1-9-5.2V6h3z" /><circle cx="8" cy="13" r="2" /></symbol>
        <symbol id="ic-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></symbol>
        <symbol id="ic-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="ic-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /></symbol>
        <symbol id="ic-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8h12l-1.2 11a1 1 0 0 1-1 .9H8.2a1 1 0 0 1-1-.9z" /><path d="M9 8a3 3 0 0 1 6 0" /></symbol>
        <symbol id="ic-swap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 8h12M14 5l3 3-3 3M19 16H7M10 13l-3 3 3 3" /></symbol>
        <symbol id="ic-id" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="2.2" /><path d="M14 9.5h4M14 13h4M5 16.2c.6-2.2 6.4-2.2 7 0" /></symbol>
        <symbol id="ic-question" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.9.3-1.3.9-1.3 1.7" /><circle cx="11.6" cy="16.4" r=".7" fill="currentColor" /></symbol>
        <symbol id="ic-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M13 3 5 13h6l-1 8 8-10h-6z" /></symbol>
        <symbol id="ic-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></symbol>
        <symbol id="ic-eleven" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="6" cy="11" r="1.6" /><circle cx="12" cy="11" r="1.6" /><circle cx="18" cy="11" r="1.6" /><circle cx="6.5" cy="18" r="1.6" /><circle cx="12" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></symbol>
        <symbol id="ic-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1.2-4.6 13.8-4.6 15 0" /></symbol>
        <symbol id="ic-stadium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="12" cy="11" rx="9" ry="5" /><path d="M3 11v3c0 2.8 4 5 9 5s9-2.2 9-5v-3" /><ellipse cx="12" cy="11" rx="3.6" ry="1.8" /></symbol>
        <symbol id="ic-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></symbol>
        <symbol id="ic-silhouette" viewBox="0 0 64 64"><circle cx="32" cy="24" r="13" fill="currentColor" /><path d="M8 60c2-15 14-22 24-22s22 7 24 22z" fill="currentColor" /></symbol>

        {/* Real Madrid (homage) */}
        <symbol id="crest-rma" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#f5f2e9" />
          <circle cx="50" cy="50" r="48" fill="none" stroke="#1b2a5b" strokeWidth="4" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#c9a24a" strokeWidth="2.2" />
          <path d="M33 41 l4.5 -11 7 8.5 5.5 -12 5.5 12 7 -8.5 4.5 11 z" fill="#c9a24a" />
          <text x="50" y="70" style={crestFont} fontWeight="800" fontSize="30" fill="#1b2a5b" textAnchor="middle" letterSpacing="1">RM</text>
        </symbol>
      </defs>
    </svg>
  );
}

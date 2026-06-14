/**
 * Reusable SVG art components for player profile choices.
 * Used in both the ProfileSetupModal and the in-game screens.
 */

/* ─── Avatar art ─── */

export function AvatarVeteranArt() {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="140" fill="#0c1220" />
      <ellipse cx="60" cy="70" rx="60" ry="70" fill="#200818" opacity=".5" />
      <path d="M0 140 C0 102 120 102 120 140Z" fill="#141e30" />
      <rect x="50" y="78" width="20" height="22" rx="4" fill="#1a2640" />
      <polygon points="60,78 57,87 60,110 63,87" fill="#9c1020" />
      <path d="M0 140 L18 108 L38 96 L50 90 L46 106 L24 116Z" fill="#0e1828" />
      <path d="M120 140 L102 108 L82 96 L70 90 L74 106 L96 116Z" fill="#0e1828" />
      <ellipse cx="60" cy="54" rx="24" ry="26" fill="#2a3c54" />
      <path d="M36 51 Q36 28 60 26 Q84 28 84 51 Q80 38 60 36 Q40 38 36 51Z" fill="#7a8a9e" />
      <ellipse cx="60" cy="62" rx="14" ry="10" fill="#1e2e44" opacity=".4" />
    </svg>
  );
}

export function AvatarModernArt() {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="140" fill="#0a1422" />
      <ellipse cx="60" cy="70" rx="60" ry="70" fill="#081a38" opacity=".6" />
      <path d="M0 140 C0 100 120 100 120 140Z" fill="#0e1e34" />
      <rect x="55" y="78" width="10" height="24" fill="#142a46" />
      <path d="M48 80 L60 76 L72 80 L70 90 L60 86 L50 90Z" fill="#1a2e48" />
      <rect x="0" y="104" width="44" height="3" rx="1.5" fill="#1a3050" />
      <rect x="76" y="104" width="44" height="3" rx="1.5" fill="#1a3050" />
      <circle cx="60" cy="54" r="24" fill="#243648" />
      <path d="M36 52 Q36 30 60 28 Q84 30 84 52 Q82 36 60 34 Q38 36 36 52Z" fill="#141e30" />
      <rect x="36" y="50" width="48" height="6" rx="3" fill="#141e30" />
    </svg>
  );
}

export function AvatarVisionaryArt() {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="140" fill="#100e08" />
      <ellipse cx="60" cy="70" rx="60" ry="70" fill="#281a04" opacity=".6" />
      <path d="M0 140 C0 96 120 96 120 140Z" fill="#1a1608" />
      <path d="M44 82 L60 78 L76 82 L74 94 L60 90 L46 94Z" fill="#22200a" />
      <rect x="58" y="78" width="4" height="30" fill="#8a6a20" />
      <ellipse cx="60" cy="52" rx="22" ry="25" fill="#2e2818" />
      <path d="M38 50 Q38 26 60 24 Q82 26 82 50 Q80 36 60 34 Q40 36 38 50Z" fill="#1a1206" />
      <path d="M38 50 Q34 64 36 78 L44 76 Q42 64 42 50Z" fill="#1a1206" />
      <path d="M82 50 Q86 64 84 78 L76 76 Q78 64 78 50Z" fill="#1a1206" />
      <path d="M60 24 Q66 24 70 28 Q64 27 60 27 Q56 27 50 28 Q54 24 60 24Z" fill="#c8a040" opacity=".35" />
    </svg>
  );
}

export function AvatarArt({ id, className }: { id: string | null; className?: string }) {
  const inner =
    id === "veteran"   ? <AvatarVeteranArt /> :
    id === "modern"    ? <AvatarModernArt /> :
    id === "visionary" ? <AvatarVisionaryArt /> :
    <AvatarVeteranArt />;

  if (!className) return inner;
  return <span className={className}>{inner}</span>;
}

/* ─── Shield art ─── */

export function ShieldClasicoArt() {
  return (
    <svg viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="130" fill="#0a0e1a" />
      <path d="M60 108 Q20 90 18 52 L18 24 Q39 20 60 14 Q81 20 102 24 L102 52 Q100 90 60 108Z" fill="#141e30" />
      <path d="M60 100 Q26 84 24 50 L24 30 Q42 26 60 20 Q78 26 96 30 L96 50 Q94 84 60 100Z" fill="#0e1828" stroke="#283a54" strokeWidth="1.5" />
      <rect x="56" y="20" width="8" height="80" rx="0" fill="#1a2840" />
      <rect x="24" y="56" width="72" height="8" rx="0" fill="#1a2840" />
      <path d="M24 30 L56 30 L56 56 L24 56 L24 50 Q25 38 24 30Z" fill="#8c0e1e" />
      <path d="M64 64 L96 64 L96 50 Q94 76 60 100 L60 64Z" fill="#8c0e1e" opacity=".9" />
      <path d="M60 108 Q20 90 18 52 L18 24 Q39 20 60 14 Q81 20 102 24 L102 52 Q100 90 60 108Z"
        fill="none" stroke="#c8a040" strokeWidth="2" />
    </svg>
  );
}

export function ShieldCirculoArt() {
  return (
    <svg viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="130" fill="#0a0e1a" />
      <circle cx="60" cy="66" r="46" fill="#141e30" />
      <circle cx="60" cy="66" r="46" fill="none" stroke="#c8a040" strokeWidth="2" />
      <circle cx="60" cy="66" r="38" fill="#0e1828" />
      <circle cx="60" cy="66" r="38" fill="none" stroke="#283a54" strokeWidth="1.5" />
      <circle cx="60" cy="66" r="30" fill="none" stroke="#1e2e44" strokeWidth="2" />
      <rect x="57" y="38" width="6" height="56" rx="1" fill="#1e2e48" />
      <rect x="32" y="63" width="56" height="6" rx="1" fill="#1e2e48" />
      <circle cx="60" cy="66" r="10" fill="#8c0e1e" />
      <circle cx="60" cy="66" r="6" fill="#c8a040" opacity=".8" />
      <path d="M22 48 Q60 36 98 48 Q60 40 22 48Z" fill="#c8a040" opacity=".4" />
    </svg>
  );
}

export function ShieldAngularArt() {
  return (
    <svg viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="130" fill="#0a0e1a" />
      <path d="M60 14 L104 36 L104 80 L60 116 L16 80 L16 36Z" fill="#141e30" />
      <path d="M60 22 L96 40 L96 76 L60 108 L24 76 L24 40Z" fill="#0e1828" stroke="#283a54" strokeWidth="1" />
      <path d="M24 40 L96 76 L96 40Z" fill="#1a2840" />
      <path d="M60 22 L96 40 L24 40Z" fill="#7a0e1e" opacity=".85" />
      <path d="M24 76 L96 76 L60 108Z" fill="#1e3050" />
      <path d="M60 48 L70 66 L60 84 L50 66Z" fill="#c8a040" opacity=".6" />
      <path d="M60 14 L104 36 L104 80 L60 116 L16 80 L16 36Z"
        fill="none" stroke="#c8a040" strokeWidth="2" />
    </svg>
  );
}

/* ─── Stadium art ─── */

export function StadiumColiseoArt() {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#0a0e18" />
      <path d="M10 110 L18 54 Q40 14 100 12 Q160 14 182 54 L190 110Z" fill="#141e2e" />
      <path d="M30 110 L36 62 Q54 32 100 30 Q146 32 164 62 L170 110Z" fill="#0e1624" />
      <rect x="46" y="96" width="108" height="16" rx="2" fill="#143824" />
      <rect x="94" y="96" width="12" height="16" fill="#183e28" />
      <ellipse cx="100" cy="104" rx="20" ry="8" fill="none" stroke="#1d4d30" strokeWidth="1.5" />
      <rect x="22" y="54" width="5" height="56" rx="1" fill="#0c1420" />
      <rect x="52" y="26" width="5" height="84" rx="1" fill="#0c1420" />
      <rect x="100" y="14" width="5" height="96" rx="1" fill="#0c1420" opacity=".5" />
      <rect x="143" y="26" width="5" height="84" rx="1" fill="#0c1420" />
      <rect x="173" y="54" width="5" height="56" rx="1" fill="#0c1420" />
      <circle cx="18" cy="52" r="6" fill="#f4e888" opacity=".85" />
      <circle cx="182" cy="52" r="6" fill="#f4e888" opacity=".85" />
      <line x1="18" y1="58" x2="18" y2="52" stroke="#f4e888" strokeWidth="1" opacity=".4" />
      <line x1="182" y1="58" x2="182" y2="52" stroke="#f4e888" strokeWidth="1" opacity=".4" />
      <rect x="30" y="62" width="140" height="14" rx="2" fill="#101a28" />
      <rect x="22" y="56" width="156" height="8" rx="2" fill="#0e1826" />
    </svg>
  );
}

export function StadiumArenaArt() {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#080e1a" />
      <path d="M0 80 L30 20 L170 20 L200 80Z" fill="#141c2c" />
      <path d="M0 80 L30 20 L170 20 L200 80 L190 80 L162 26 L38 26 L10 80Z" fill="#1a2438" />
      <path d="M30 20 L38 26 L162 26 L170 20Z" fill="#203044" />
      <rect x="6" y="80" width="188" height="32" rx="0" fill="#10192a" />
      <rect x="26" y="84" width="148" height="24" rx="2" fill="#142e1c" />
      <rect x="94" y="84" width="12" height="24" fill="#183620" />
      <rect x="6" y="78" width="188" height="4" rx="0" fill="#1e3060" />
      <rect x="40" y="88" width="18" height="16" rx="1" fill="#0a1220" />
      <rect x="142" y="88" width="18" height="16" rx="1" fill="#0a1220" />
      <rect x="30" y="26" width="4" height="54" rx="1" fill="#0e1828" />
      <rect x="166" y="26" width="4" height="54" rx="1" fill="#0e1828" />
      <rect x="74" y="26" width="3" height="54" rx="1" fill="#0e1828" opacity=".7" />
      <rect x="123" y="26" width="3" height="54" rx="1" fill="#0e1828" opacity=".7" />
      <rect x="0" y="78" width="200" height="2" rx="0" fill="#3050a0" opacity=".5" />
      <rect x="0" y="80" width="200" height="1" rx="0" fill="#4060c0" opacity=".3" />
    </svg>
  );
}

export function StadiumFortalezaArt() {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#080c14" />
      <rect x="8" y="20" width="36" height="90" rx="2" fill="#12182a" />
      <rect x="156" y="20" width="36" height="90" rx="2" fill="#12182a" />
      <rect x="44" y="10" width="112" height="100" rx="2" fill="#141c2e" />
      <rect x="44" y="10" width="112" height="16" rx="2" fill="#1a2438" />
      <rect x="8" y="12" width="8" height="10" rx="1" fill="#1a2438" />
      <rect x="20" y="12" width="8" height="10" rx="1" fill="#1a2438" />
      <rect x="32" y="12" width="10" height="10" rx="1" fill="#1a2438" />
      <rect x="160" y="12" width="8" height="10" rx="1" fill="#1a2438" />
      <rect x="172" y="12" width="8" height="10" rx="1" fill="#1a2438" />
      <rect x="182" y="12" width="10" height="10" rx="1" fill="#1a2438" />
      <rect x="50" y="86" width="100" height="22" rx="1" fill="#12281a" />
      <rect x="95" y="86" width="10" height="22" fill="#162c1e" />
      <rect x="50" y="28" width="100" height="56" rx="1" fill="#101828" />
      <rect x="50" y="28" width="100" height="4" fill="#1a243a" />
      <rect x="14" y="38" width="24" height="30" rx="3" fill="#0c121e" />
      <rect x="162" y="38" width="24" height="30" rx="3" fill="#0c121e" />
      <path d="M85 112 L85 94 Q100 88 115 94 L115 112Z" fill="#0a0f1c" />
    </svg>
  );
}

export function ShieldArt({ id, className }: { id: string | null; className?: string }) {
  const inner =
    id === "clasico"  ? <ShieldClasicoArt /> :
    id === "circulo"  ? <ShieldCirculoArt /> :
    id === "angular"  ? <ShieldAngularArt /> :
    <ShieldClasicoArt />;

  if (!className) return inner;
  return <span className={className}>{inner}</span>;
}

export function StadiumArt({ id, className }: { id: string | null; className?: string }) {
  const inner =
    id === "coliseo"   ? <StadiumColiseoArt /> :
    id === "arena"     ? <StadiumArenaArt /> :
    id === "fortaleza" ? <StadiumFortalezaArt /> :
    <StadiumColiseoArt />;

  if (!className) return inner;
  return <span className={className}>{inner}</span>;
}

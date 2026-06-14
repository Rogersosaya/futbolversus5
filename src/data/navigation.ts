/** Navigation model: the home hub side nav and the bottom screen switcher. */

export interface HomeNavItem {
  label: string;
  ic: string;
  href: string;
}

export interface HomeNavSection {
  eyebrow: string;
  items: HomeNavItem[];
}

/** Left-hand navigation inside the Menú screen. */
export const HOME_NAV: HomeNavSection[] = [
  {
    eyebrow: "JUGAR",
    items: [
      { label: "Partido de Liga", ic: "ic-ball", href: "/" },
      { label: "Amistoso", ic: "ic-whistle", href: "/amistoso" },
      { label: "Desafío Individual", ic: "ic-target", href: "/desafio" },
      { label: "Torneos", ic: "ic-cup", href: "/torneos" },
    ],
  },
  {
    eyebrow: "CUENTA",
    items: [
      { label: "Mercado", ic: "ic-cart", href: "/mercado" },
      { label: "Transfermarket", ic: "ic-swap", href: "/transfer" },
      { label: "Mi Club", ic: "ic-shield", href: "/club" },
    ],
  },
];


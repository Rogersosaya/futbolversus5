/** Mercado (store) catalogue: clubs, avatars and stadiums to unlock. */
import type { CrestId } from "@/components/svg";

export type StoreTab = "club" | "avatar" | "estadio";
export type Rarity = "legend" | "epic" | "rare";

/** How a store item's art tile is rendered. */
export type StoreArt =
  | { kind: "image"; src: string }
  | { kind: "crest"; id: CrestId }
  | { kind: "avatar" }
  | { kind: "stadium"; gradient: [string, string] };

export interface StoreItem {
  name: string;
  meta: string;
  rare?: Rarity;
  price: string;
  owned?: boolean;
  /** League id this item belongs to (drives the lock state). */
  lg?: string;
  art: StoreArt;
}

export const STORE_TABS: { key: StoreTab; ic: string; label: string }[] = [
  { key: "club", ic: "ic-shield", label: "CLUBES" },
  { key: "avatar", ic: "ic-user", label: "AVATARES" },
  { key: "estadio", ic: "ic-stadium", label: "ESTADIOS" },
];

export const STORE: Record<StoreTab, StoreItem[]> = {
  club: [
    { name: "Real Madrid", meta: "LaLiga · España", rare: "legend", price: "25 000", owned: true, lg: "es", art: { kind: "crest", id: "crest-rma" } },
    { name: "Universitario", meta: "Liga 1 · Perú", rare: "epic", price: "12 000", lg: "pe", art: { kind: "crest", id: "crest-uni" } },
    { name: "Fluminense", meta: "Brasileirão · Brasil", rare: "rare", price: "9 500", lg: "br", art: { kind: "crest", id: "crest-flu" } },
    { name: "Colo-Colo", meta: "Primera · Chile", rare: "rare", price: "8 000", lg: "ar", art: { kind: "crest", id: "crest-col" } },
    { name: "Nacional", meta: "Primera · Uruguay", rare: "rare", price: "7 500", lg: "br", art: { kind: "crest", id: "crest-nac" } },
    { name: "Olympique", meta: "Ligue 1 · Francia", rare: "epic", price: "18 000", lg: "fr", art: { kind: "crest", id: "crest-nac" } },
    { name: "Juventus", meta: "Serie A · Italia", rare: "legend", price: "28 000", lg: "it", art: { kind: "crest", id: "crest-col" } },
  ],
  avatar: [
    { name: "La Pulga", meta: "Avatar caricatura", rare: "legend", price: "30 000", owned: true, lg: "pe", art: { kind: "avatar" } },
    { name: "El Comandante", meta: "Avatar caricatura", rare: "epic", price: "14 000", lg: "br", art: { kind: "avatar" } },
    { name: "Crack 10", meta: "Avatar caricatura", rare: "epic", price: "14 000", lg: "ar", art: { kind: "avatar" } },
    { name: "Muralla", meta: "Avatar caricatura", rare: "rare", price: "8 000", lg: "pe", art: { kind: "avatar" } },
    { name: "El Káiser", meta: "Avatar caricatura", rare: "epic", price: "20 000", lg: "de", art: { kind: "avatar" } },
    { name: "The Special", meta: "Avatar caricatura", rare: "legend", price: "32 000", lg: "en", art: { kind: "avatar" } },
  ],
  estadio: [
    { name: "La Bombonera", meta: "Buenos Aires · ARG", rare: "legend", price: "40 000", lg: "ar", art: { kind: "image", src: "/assets/bombonera.jpg" } },
    { name: "Monumental", meta: "Lima · PER", rare: "epic", price: "22 000", lg: "pe", art: { kind: "stadium", gradient: ["#2a6f43", "#12361f"] } },
    { name: "Maracanã", meta: "Río · BRA", rare: "epic", price: "22 000", lg: "br", art: { kind: "stadium", gradient: ["#9c2a3a", "#4a1219"] } },
    { name: "San Siro", meta: "Milán · ITA", rare: "epic", price: "30 000", lg: "it", art: { kind: "stadium", gradient: ["#2a4f8f", "#15294a"] } },
    { name: "Bernabéu", meta: "Madrid · ESP", rare: "legend", price: "45 000", lg: "es", art: { kind: "stadium", gradient: ["#6a5a2a", "#2e2710"] } },
    { name: "Old Trafford", meta: "Mánchester · ING", rare: "legend", price: "48 000", lg: "en", art: { kind: "stadium", gradient: ["#7a1f2a", "#3a0f15"] } },
  ],
};

export const RARITY_LABEL: Record<Rarity, string> = {
  legend: "LEYENDA",
  epic: "ÉPICO",
  rare: "RARO",
};

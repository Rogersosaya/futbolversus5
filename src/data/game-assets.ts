export const COUNTRIES = [
  { code: "ar", name: "Argentina",     flag: "🇦🇷" },
  { code: "br", name: "Brasil",        flag: "🇧🇷" },
  { code: "es", name: "España",        flag: "🇪🇸" },
  { code: "fr", name: "Francia",       flag: "🇫🇷" },
  { code: "de", name: "Alemania",      flag: "🇩🇪" },
  { code: "gb", name: "Inglaterra",    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "it", name: "Italia",        flag: "🇮🇹" },
  { code: "pt", name: "Portugal",      flag: "🇵🇹" },
  { code: "nl", name: "Países Bajos",  flag: "🇳🇱" },
  { code: "be", name: "Bélgica",       flag: "🇧🇪" },
  { code: "mx", name: "México",        flag: "🇲🇽" },
  { code: "co", name: "Colombia",      flag: "🇨🇴" },
  { code: "uy", name: "Uruguay",       flag: "🇺🇾" },
  { code: "cl", name: "Chile",         flag: "🇨🇱" },
  { code: "pe", name: "Perú",          flag: "🇵🇪" },
  { code: "ec", name: "Ecuador",       flag: "🇪🇨" },
  { code: "jp", name: "Japón",         flag: "🇯🇵" },
  { code: "us", name: "EE. UU.",       flag: "🇺🇸" },
  { code: "hr", name: "Croacia",       flag: "🇭🇷" },
  { code: "ma", name: "Marruecos",     flag: "🇲🇦" },
  { code: "sn", name: "Senegal",       flag: "🇸🇳" },
  { code: "ng", name: "Nigeria",       flag: "🇳🇬" },
  { code: "kr", name: "Corea del Sur", flag: "🇰🇷" },
  { code: "dk", name: "Dinamarca",     flag: "🇩🇰" },
  { code: "au", name: "Australia",     flag: "🇦🇺" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function countryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

export const AVATARS = [
  { id: "veteran",   name: "EL VETERANO",   desc: "Décadas de experiencia. Autoridad en el vestuario." },
  { id: "modern",    name: "EL MODERNO",    desc: "Datos, tecnología y visión de futuro." },
  { id: "visionary", name: "LA VISIONARIA", desc: "Liderazgo que rompe esquemas. Resultados que callan bocas." },
] as const;

export const STADIUMS = [
  { id: "coliseo",   name: "COLISEO NACIONAL", desc: "Clásico e histórico. Cuna de grandes glorias." },
  { id: "arena",     name: "ARENA FUTURO",     desc: "Moderno, tecnológico. El estadio del mañana." },
  { id: "fortaleza", name: "LA FORTALEZA",     desc: "Compacto e intimidante. Local infranqueable." },
] as const;

export const SHIELDS = [
  { id: "clasico",  name: "CLÁSICO",   desc: "Escudo heráldico tradicional." },
  { id: "circulo",  name: "CIRCULAR",  desc: "Insignia redonda de inspiración moderna." },
  { id: "angular",  name: "ANGULAR",   desc: "Geometría audaz para un club ambicioso." },
] as const;

export type AvatarId  = (typeof AVATARS)[number]["id"];
export type StadiumId = (typeof STADIUMS)[number]["id"];
export type ShieldId  = (typeof SHIELDS)[number]["id"];

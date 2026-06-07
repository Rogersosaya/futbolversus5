/** Transfermarket: ranking of clubs by market value. */
import type { CrestRef } from "@/components/svg";

export interface TransferRow {
  pos: number;
  club: string;
  president: string;
  /** Country code (for the 3-letter label). */
  country: string;
  value: string;
  crest: CrestRef;
  /** Marks the player's own club. */
  me?: boolean;
}

export const TRANSFER_RANKING: TransferRow[] = [
  { pos: 1, club: "Boca Juniors", president: "ElXeneize", country: "ar", value: "512,400", crest: { kind: "mini", initials: "CB", fill: "#0a2a6b", stroke: "#f4c430" } },
  { pos: 2, club: "River Plate", president: "Millonario07", country: "ar", value: "487,900", crest: { kind: "mini", initials: "CARP", fill: "#f2f3f7", stroke: "#d4163c", text: "#0a2a6b" } },
  { pos: 3, club: "Flamengo", president: "Mengão", country: "br", value: "451,200", crest: { kind: "mini", initials: "FLA", fill: "#c8102e", stroke: "#101418" } },
  { pos: 4, club: "Peñarol", president: "Carbonero", country: "uy", value: "398,600", crest: { kind: "mini", initials: "CAP", fill: "#101418", stroke: "#f4c430" } },
  { pos: 5, club: "Universitario", president: "CremaTotal", country: "pe", value: "342,800", crest: { kind: "symbol", id: "crest-uni" } },
  { pos: 6, club: "Colo-Colo", president: "ElCacique", country: "cl", value: "271,500", crest: { kind: "symbol", id: "crest-col" } },
  { pos: 7, club: "Nacional", president: "Bolso", country: "uy", value: "233,900", crest: { kind: "symbol", id: "crest-nac" } },
  { pos: 8, club: "Real Madrid", president: "Roger", country: "pe", value: "184,500", crest: { kind: "symbol", id: "crest-rma" }, me: true },
  { pos: 9, club: "Fluminense", president: "TricolorRJ", country: "br", value: "156,200", crest: { kind: "symbol", id: "crest-flu" } },
  { pos: 10, club: "Liga de Quito", president: "AlboUIO", country: "ec", value: "142,000", crest: { kind: "mini", initials: "LDU", fill: "#f2f3f7", stroke: "#101418", text: "#101418" } },
  { pos: 11, club: "Cerro Porteño", president: "Ciclón", country: "py", value: "128,700", crest: { kind: "mini", initials: "CCP", fill: "#c8102e", stroke: "#0a2a6b" } },
  { pos: 12, club: "Alianza Lima", president: "Íntimo", country: "pe", value: "119,400", crest: { kind: "mini", initials: "AL", fill: "#0a2a6b", stroke: "#f2f3f7", text: "#f2f3f7" } },
];

/** 3-letter country labels used in the ranking. */
export const COUNTRY_LABEL: Record<string, string> = {
  ar: "ARG",
  br: "BRA",
  uy: "URU",
  pe: "PER",
  cl: "CHI",
  ec: "ECU",
  py: "PAR",
};

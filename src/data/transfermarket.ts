/** Transfermarket: the rival clubs the player is ranked against, by market value. */
import type { CrestRef } from "@/components/svg";

export interface TransferClub {
  club: string;
  president: string;
  /** Country code (for the 3-letter label). */
  country: string;
  /** Market value in full euros. */
  value: number;
  crest: CrestRef;
}

/** Rival clubs. The player's own club is merged in (with its real value) server-side. */
export const TRANSFER_BASE: TransferClub[] = [
  { club: "Boca Juniors", president: "ElXeneize", country: "ar", value: 512_400_000, crest: { kind: "mini", initials: "CB", fill: "#0a2a6b", stroke: "#f4c430" } },
  { club: "River Plate", president: "Millonario07", country: "ar", value: 487_900_000, crest: { kind: "mini", initials: "CARP", fill: "#f2f3f7", stroke: "#d4163c", text: "#0a2a6b" } },
  { club: "Flamengo", president: "Mengão", country: "br", value: 451_200_000, crest: { kind: "mini", initials: "FLA", fill: "#c8102e", stroke: "#101418" } },
  { club: "Peñarol", president: "Carbonero", country: "uy", value: 398_600_000, crest: { kind: "mini", initials: "CAP", fill: "#101418", stroke: "#f4c430" } },
  { club: "Universitario", president: "CremaTotal", country: "pe", value: 342_800_000, crest: { kind: "symbol", id: "crest-uni" } },
  { club: "Colo-Colo", president: "ElCacique", country: "cl", value: 271_500_000, crest: { kind: "symbol", id: "crest-col" } },
  { club: "Nacional", president: "Bolso", country: "uy", value: 233_900_000, crest: { kind: "symbol", id: "crest-nac" } },
  { club: "Fluminense", president: "TricolorRJ", country: "br", value: 156_200_000, crest: { kind: "symbol", id: "crest-flu" } },
  { club: "Liga de Quito", president: "AlboUIO", country: "ec", value: 142_000_000, crest: { kind: "mini", initials: "LDU", fill: "#f2f3f7", stroke: "#101418", text: "#101418" } },
  { club: "Cerro Porteño", president: "Ciclón", country: "py", value: 128_700_000, crest: { kind: "mini", initials: "CCP", fill: "#c8102e", stroke: "#0a2a6b" } },
  { club: "Alianza Lima", president: "Íntimo", country: "pe", value: 119_400_000, crest: { kind: "mini", initials: "AL", fill: "#0a2a6b", stroke: "#f2f3f7", text: "#f2f3f7" } },
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

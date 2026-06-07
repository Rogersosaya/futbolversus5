/** Pre-match lobby (VS matchmaking) data. */
import type { CrestRef } from "@/components/svg";

export interface LobbyTeam {
  country: string;
  flag: string;
  club: string;
  crest: CrestRef;
  president: string;
  rating: number;
  stats: { label: string; value: string }[];
  /** Avatar: image for the player, initials+color for opponents. */
  avatar: { kind: "image"; src: string } | { kind: "initials"; text: string; color: string };
}

export const LOBBY_ME: LobbyTeam = {
  country: "Perú",
  flag: "pe",
  club: "Real Madrid",
  crest: { kind: "symbol", id: "crest-rma" },
  president: "Roger",
  rating: 78,
  stats: [
    { label: "NIVEL", value: "24" },
    { label: "PODER", value: "78" },
    { label: "VICT.", value: "71%" },
  ],
  avatar: { kind: "image", src: "/assets/messi-avatar.png" },
};

export const LOBBY_OPP_LIGA: LobbyTeam = {
  country: "Brasil",
  flag: "br",
  club: "Flamengo",
  crest: { kind: "mini", initials: "FLA", fill: "#c8102e", stroke: "#101418" },
  president: "Carlos_DT",
  rating: 81,
  stats: [
    { label: "NIVEL", value: "26" },
    { label: "PODER", value: "81" },
    { label: "VICT.", value: "68%" },
  ],
  avatar: { kind: "initials", text: "C", color: "#27303f" },
};

export const LOBBY_OPP_AMIS: LobbyTeam = {
  country: "Argentina",
  flag: "ar",
  club: "Boca Juniors",
  crest: { kind: "mini", initials: "CB", fill: "#0a2a6b", stroke: "#f4c430" },
  president: "Lucía_10",
  rating: 72,
  stats: [
    { label: "NIVEL", value: "19" },
    { label: "PODER", value: "72" },
    { label: "VICT.", value: "64%" },
  ],
  avatar: { kind: "initials", text: "L", color: "#27303f" },
};

export type FriendStatus = "on" | "idle" | "off";

export interface Friend {
  name: string;
  club: string;
  initial: string;
  color: string;
  status: FriendStatus;
}

export const FRIENDS: Friend[] = [
  { name: "Mateo_RM", club: "River Plate", initial: "M", color: "#d4163c", status: "on" },
  { name: "Sofía99", club: "Peñarol", initial: "S", color: "#caa341", status: "on" },
  { name: "ElProfe", club: "Liga de Quito", initial: "E", color: "#3a5bd0", status: "idle" },
  { name: "Naranja7", club: "Cienciano", initial: "N", color: "#1e8a4d", status: "off" },
];

export const FRIEND_STATUS_LABEL: Record<FriendStatus, string> = {
  on: "En línea",
  idle: "Ausente",
  off: "Desconectado",
};

export const INVITE_CODE = "RGR-7K2P";

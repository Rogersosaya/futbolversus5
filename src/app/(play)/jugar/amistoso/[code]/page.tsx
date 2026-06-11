import { redirect } from "next/navigation";

import { getAuthUserId } from "@/actions/profile";
import {
  claimGuestSeat,
  getRoomByCode,
  getRoomLobbyData,
} from "@/actions/matchroom";
import { timelineDone } from "@/lib/match-timeline";

import { RoomLobby } from "./RoomLobby";
import { RoomUnavailable } from "./RoomUnavailable";

/**
 * A friendly-match room lobby at /jugar/amistoso/<code>. Access control:
 * - host / guest → the lobby (invite panel or match-found, by room state)
 * - anyone else while the guest seat is free → joins DIRECTLY (the link IS the
 *   invitation; the seat is claimed atomically, first to open it wins)
 * - anyone else otherwise → blocked
 * - signed out → login (the proxy adds ?next= so they come back here)
 */
export default async function MatchRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase();

  const userId = await getAuthUserId();
  if (!userId) redirect(`/login?next=/jugar/amistoso/${code}`);

  let room = await getRoomByCode(code);
  if (!room || room.status === "CLOSED") {
    return <RoomUnavailable reason="closed" />;
  }

  // Not a member yet and the seat is free → opening the link claims it
  // (first click wins). On success re-read the room and fall through to the
  // lobby as the guest; the host hears about it over Broadcast.
  if (room.hostId !== userId && room.guestId !== userId) {
    if (room.status !== "OPEN" || room.guestId) {
      return <RoomUnavailable reason="full" />;
    }
    const res = await claimGuestSeat(code, userId);
    if (!res.ok) {
      return <RoomUnavailable reason="full" />;
    }
    room = await getRoomByCode(code);
    if (!room) return <RoomUnavailable reason="closed" />;
  }

  // The match already started (or its entry cinematic fully elapsed while
  // this player was away) → straight to the game room. A refresh mid-cinematic
  // does NOT redirect: the lobby resumes the sequence at the right beat.
  if (room.status === "IN_GAME" || (room.status === "READY" && timelineDone(room.readyAt))) {
    redirect(`/jugar/amistoso/${code}/partido`);
  }

  const lobby = await getRoomLobbyData(room, userId);
  if (!lobby) return <RoomUnavailable reason="closed" />;
  return <RoomLobby initial={lobby} />;
}

import { redirect } from "next/navigation";

import { getAuthUserId } from "@/actions/profile";
import { getRoomByCode, getRoomJoinData, getRoomLobbyData } from "@/actions/matchroom";

import { RoomLobby } from "./RoomLobby";
import { RoomJoin } from "./RoomJoin";
import { RoomUnavailable } from "./RoomUnavailable";

/**
 * A friendly-match room lobby at /jugar/amistoso/<code>. Access control:
 * - host / guest → the lobby (invite panel or match-found, by room state)
 * - anyone else while the guest seat is free → join screen (first click wins)
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

  const room = await getRoomByCode(code);
  if (!room || room.status === "CLOSED") {
    return <RoomUnavailable reason="closed" />;
  }

  const lobby = await getRoomLobbyData(room, userId);
  if (lobby) {
    return <RoomLobby initial={lobby} />;
  }

  // Not a member. While the guest seat is free the link works as an open
  // invitation; once taken (or if the visitor manipulated the code) → blocked.
  if (room.status === "OPEN" && !room.guestId) {
    const join = await getRoomJoinData(room);
    if (join) return <RoomJoin data={join} />;
  }
  return <RoomUnavailable reason="full" />;
}

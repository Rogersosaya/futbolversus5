import { redirect } from "next/navigation";

import { getAuthUserId } from "@/actions/profile";
import { getArenaData, getRoomByCode, markRoomInGame } from "@/actions/matchroom";
import { getMatchGameStateCore } from "@/actions/match-game";

import { RoomUnavailable } from "../RoomUnavailable";
import { MatchArena } from "./MatchArena";

/**
 * The game room at /jugar/amistoso/<code>/partido. Members only. The lobby
 * owns every pre-kickoff state; landing here with a READY room whose entry
 * cinematic was anchored (readyAt stamped) promotes it to IN_GAME — an
 * idempotent first-write-wins update, so it doesn't matter which player's
 * cinematic finishes first or whether both arrive at once. FINISHED rooms
 * render the arena in result mode (a reload after full time is legitimate);
 * only CLOSED (abandoned) rooms are unavailable.
 */
export default async function MatchArenaPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase();

  const userId = await getAuthUserId();
  if (!userId) redirect(`/login?next=/jugar/amistoso/${code}/partido`);

  let room = await getRoomByCode(code);
  if (!room || room.status === "CLOSED") return <RoomUnavailable reason="closed" />;
  if (room.hostId !== userId && room.guestId !== userId) {
    return <RoomUnavailable reason="full" />;
  }

  // Not at kickoff yet (no rival, or the entry sequence never started) → the
  // lobby is the right screen.
  if (room.status === "OPEN" || (room.status === "READY" && !room.readyAt)) {
    redirect(`/jugar/amistoso/${code}`);
  }

  if (room.status === "READY") {
    await markRoomInGame(room);
    room = await getRoomByCode(code);
    if (!room || room.status === "CLOSED") return <RoomUnavailable reason="closed" />;
    if (room.status !== "IN_GAME" && room.status !== "FINISHED") {
      redirect(`/jugar/amistoso/${code}`);
    }
  }

  const [arena, game] = await Promise.all([
    getArenaData(room, userId),
    getMatchGameStateCore(room, userId),
  ]);
  if (!arena || !game) redirect(`/jugar/amistoso/${code}`);
  return <MatchArena initial={arena} initialGame={game} />;
}

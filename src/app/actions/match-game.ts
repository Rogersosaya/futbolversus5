"use server";

// Client-callable wrappers of the "Once Mundialista" game logic. Each resolves
// the caller from Supabase auth and delegates to the trusted core in
// src/actions/match-game.ts — nothing here accepts a userId from the client.
import { prisma } from "@/lib/prisma";
import { createSSRClient } from "@/lib/supabase-server";
import {
  changeNationCore,
  claimCellCore,
  finalizeIfDueCore,
  finishEarlyCore,
  getMatchGameStateCore,
  requestRematchCore,
  searchPlayersCore,
  type ChangeNationResult,
  type ClaimResult,
  type MatchGameState,
  type PlayerHit,
  type RematchState,
} from "@/actions/match-game";
import type { MatchRoom } from "@/generated/prisma/client";

async function requireUser(): Promise<string | null> {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function memberRoom(code: string, userId: string): Promise<MatchRoom | null> {
  const room = await prisma.matchRoom.findUnique({ where: { code } });
  if (!room || (room.hostId !== userId && room.guestId !== userId)) return null;
  return room;
}

/** Global player search for the in-game search box. Needs only a session (the
 * result leaks no position/country — guessing right is the game). */
export async function searchPlayers(q: string): Promise<PlayerHit[]> {
  const userId = await requireUser();
  if (!userId) return [];
  return searchPlayersCore(q);
}

/** Live role-relative snapshot — the realtime refetch target. */
export async function getMatchGameState(code: string): Promise<MatchGameState | null> {
  const userId = await requireUser();
  if (!userId) return null;
  const room = await memberRoom(code, userId);
  if (!room) return null;
  return getMatchGameStateCore(room, userId);
}

export async function claimCell(
  code: string,
  cellId: string,
  playerId: number,
): Promise<ClaimResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, code: "NOT_MEMBER", serverNow: Date.now() };
  const room = await memberRoom(code, userId);
  if (!room) return { ok: false, code: "NOT_MEMBER", serverNow: Date.now() };
  return claimCellCore(room, userId, cellId, playerId);
}

export async function changeNation(code: string): Promise<ChangeNationResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, serverNow: Date.now() };
  const room = await memberRoom(code, userId);
  if (!room) return { ok: false, serverNow: Date.now() };
  return changeNationCore(room, userId);
}

/** End the match early once the lead is mathematically unreachable. */
export async function finishEarly(code: string): Promise<{ ok: boolean; serverNow: number }> {
  const userId = await requireUser();
  if (!userId) return { ok: false, serverNow: Date.now() };
  const room = await memberRoom(code, userId);
  if (!room) return { ok: false, serverNow: Date.now() };
  const ok = await finishEarlyCore(room, userId);
  return { ok, serverNow: Date.now() };
}

/** Stamp my rematch request on a FINISHED room (both stamps → new match). */
export async function requestRematch(code: string): Promise<RematchState | null> {
  const userId = await requireUser();
  if (!userId) return null;
  const room = await memberRoom(code, userId);
  if (!room) return null;
  return requestRematchCore(room, userId);
}

/** Timer-driven finish; both clients call it at 0:00 (idempotent). */
export async function finalizeMatch(code: string): Promise<{ ok: boolean; serverNow: number }> {
  const userId = await requireUser();
  if (!userId) return { ok: false, serverNow: Date.now() };
  const room = await memberRoom(code, userId);
  if (!room) return { ok: false, serverNow: Date.now() };
  const ok = await finalizeIfDueCore(room);
  return { ok, serverNow: Date.now() };
}

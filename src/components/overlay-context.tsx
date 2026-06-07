"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type GameMode = "liga" | "amistoso";

type OverlayState =
  | { kind: "lobby"; mode: GameMode }
  | { kind: "game"; mode: GameMode }
  | null;

interface OverlayContextValue {
  state: OverlayState;
  /** Open the pre-match lobby for a given route mode. */
  openLobby: (mode: GameMode) => void;
  /** Jump straight into the game (called by the lobby's "Comenzar"). */
  openGame: (mode: GameMode) => void;
  close: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * Holds the modal overlay state (lobby / game) shared between the menu pages
 * that trigger them and the layers that render inside the scaled canvas.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState>(null);

  const openLobby = useCallback((mode: GameMode) => setState({ kind: "lobby", mode }), []);
  const openGame = useCallback((mode: GameMode) => setState({ kind: "game", mode }), []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo(
    () => ({ state, openLobby, openGame, close }),
    [state, openLobby, openGame, close],
  );

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlay(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within an OverlayProvider");
  return ctx;
}

"use client";

import type { ReactNode } from "react";

import { OverlayProvider, useOverlay } from "@/components/overlay-context";
import { LobbyOverlay } from "@/components/overlays/LobbyOverlay";
import { GameOverlay } from "@/components/overlays/GameOverlay";

export function GameShell({ children }: { children: ReactNode }) {
  return (
    <OverlayProvider>
      <Shell>{children}</Shell>
    </OverlayProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { state } = useOverlay();

  return (
    <div id="stage">
      <div id="canvas">
        {children}
        {state?.kind === "lobby" && <LobbyOverlay mode={state.mode} />}
        {state?.kind === "game" && <GameOverlay mode={state.mode} />}
      </div>
    </div>
  );
}

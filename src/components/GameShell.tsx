"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { OverlayProvider, useOverlay } from "@/components/overlay-context";
import { LobbyOverlay } from "@/components/overlays/LobbyOverlay";
import { GameOverlay } from "@/components/overlays/GameOverlay";

const CANVAS_W = 1920;
const CANVAS_H = 1080;

export function GameShell({ children }: { children: ReactNode }) {
  return (
    <OverlayProvider>
      <Shell>{children}</Shell>
    </OverlayProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { state } = useOverlay();

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const fit = () => {
      const scale = Math.min(stage.clientWidth / CANVAS_W, stage.clientHeight / CANVAS_H);
      canvas.style.transform = `translate(-50%,-50%) scale(${scale})`;
    };

    fit();
    window.addEventListener("resize", fit, { passive: true });
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div id="stage" ref={stageRef}>
      <div id="canvas" ref={canvasRef}>
        {children}
        {state?.kind === "lobby" && <LobbyOverlay mode={state.mode} />}
        {state?.kind === "game" && <GameOverlay mode={state.mode} />}
      </div>
    </div>
  );
}

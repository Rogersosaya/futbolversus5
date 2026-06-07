"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { SCREENS } from "@/data/navigation";
import { OverlayProvider, useOverlay } from "@/components/overlay-context";
import { LobbyOverlay } from "@/components/overlays/LobbyOverlay";
import { GameOverlay } from "@/components/overlays/GameOverlay";

const CANVAS_W = 1920;
const CANVAS_H = 1080;

/** Index of the active top-level screen for the current pathname. */
function activeScreenIndex(pathname: string): number {
  const idx = SCREENS.findIndex(
    (s) => s.href === pathname || s.match?.includes(pathname),
  );
  return idx < 0 ? 0 : idx;
}

/**
 * Root presentation shell: a fixed 1920×1080 canvas scaled to fit the
 * viewport, the bottom screen switcher, and global keyboard navigation —
 * faithful to the original console-style mockup, driven by the router.
 */
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
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useOverlay();

  const activeIndex = activeScreenIndex(pathname);

  // Fit-to-viewport scaling of the fixed-size canvas.
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

  const goToScreen = useCallback(
    (index: number) => {
      const wrapped = (index + SCREENS.length) % SCREENS.length;
      router.push(SCREENS[wrapped].href);
    },
    [router],
  );

  // Keyboard navigation between screens (← → cycle, 1–5 jump, Enter next).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing inside form fields (e.g. the game's name input).
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "ArrowRight") goToScreen(activeIndex + 1);
      else if (e.key === "ArrowLeft") goToScreen(activeIndex - 1);
      else if (e.key >= "1" && e.key <= "5") goToScreen(Number(e.key) - 1);
      else if (e.key === "Enter" || e.key === " ") goToScreen(activeIndex + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, goToScreen]);

  return (
    <>
      <div id="stage" ref={stageRef}>
        <div id="canvas" ref={canvasRef}>
          {children}
          {state?.kind === "lobby" && <LobbyOverlay mode={state.mode} />}
          {state?.kind === "game" && <GameOverlay mode={state.mode} />}
        </div>
      </div>

      <nav id="chrome">
        {SCREENS.map((screen, i) => (
          <Link
            key={screen.href}
            href={screen.href}
            className={`nv${i === activeIndex ? " on" : ""}`}
          >
            {screen.label}
          </Link>
        ))}
        <span className="hint">← → · 1–5</span>
      </nav>
    </>
  );
}

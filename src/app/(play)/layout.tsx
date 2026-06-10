import type { ReactNode } from "react";

import { SvgSymbols } from "@/components/SvgSymbols";

/**
 * Full-screen shell for the in-match / matchmaking routes. Unlike the (menu)
 * layout it has no sidebar or topbar — the screen owns the whole viewport. The
 * symbol sheet is mounted here so crests/flags render, and the #stage/#canvas
 * wrapper matches the scaled canvas the lobby CSS expects.
 */
export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SvgSymbols />
      <div id="stage">
        <div id="canvas">{children}</div>
      </div>
    </>
  );
}

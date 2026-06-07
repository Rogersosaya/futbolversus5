"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Wraps a menu view in the animated `.view` container, re-keyed per route so
 * the original "viewIn" transition replays on each navigation.
 */
export function ViewFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="view" key={pathname}>
      {children}
    </div>
  );
}

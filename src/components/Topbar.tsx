import type { ReactNode } from "react";

/** The "FUTBOL·VERSUS" wordmark, shared by every top bar. */
export function Brand() {
  return (
    <div className="brand">
      <div className="mark">V</div>
      <b>
        FUTBOL<span>·</span>VERSUS
      </b>
    </div>
  );
}

/** Top bar with the brand on the left and arbitrary meta on the right. */
export function Topbar({ children }: { children: ReactNode }) {
  return (
    <div className="topbar">
      <Brand />
      <div className="meta">{children}</div>
    </div>
  );
}

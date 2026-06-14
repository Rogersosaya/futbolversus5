"use client";

import type { ReactNode } from "react";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export function MiniGameModal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="mgm-layer"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mgm-panel">
        <button className="mgm-close" onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

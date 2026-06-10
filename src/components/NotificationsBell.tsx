"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Sym } from "@/components/svg";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { ShieldArt } from "@/components/game-art";
import { useIncomingRequests } from "@/components/realtime/useIncomingRequests";
import { respondFriendRequest } from "@/app/actions/friends";
import type { RequestCard } from "@/actions/friends";

/** Topbar bell: live friend-request notifications with accept/decline. */
export function NotificationsBell({
  userId,
  initialIncoming,
}: {
  userId: string;
  initialIncoming: RequestCard[];
}) {
  const router = useRouter();
  const { incoming, refetch } = useIncomingRequests(userId, initialIncoming);
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const count = incoming.length;

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const respond = (requestId: string, accept: boolean) => {
    setPendingId(requestId);
    startTransition(async () => {
      await respondFriendRequest(requestId, accept);
      refetch();
      router.refresh();
      setPendingId(null);
    });
  };

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className={`notif-btn${count > 0 ? " has" : ""}`}
        aria-label={`Notificaciones${count > 0 ? ` (${count})` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Sym id="ic-bell" />
        {count > 0 && <span className="notif-badge">{count > 9 ? "9+" : count}</span>}
      </button>

      {open && (
        <div className="notif-pop" role="dialog" aria-label="Solicitudes de amistad">
          <div className="notif-head">SOLICITUDES DE AMISTAD</div>
          {count === 0 ? (
            <div className="notif-empty">No tienes solicitudes pendientes.</div>
          ) : (
            <ul className="notif-list">
              {incoming.map(({ requestId, player }) => (
                <li className="notif-item" key={requestId}>
                  <span className="notif-crest">
                    {player.art ? <CollectibleGlyph c={player.art} /> : <ShieldArt id={null} />}
                  </span>
                  <span className="notif-tx">
                    <b>{player.president}</b>
                    <small>{player.club}</small>
                  </span>
                  <span className="notif-acts">
                    <button
                      type="button"
                      className="notif-yes"
                      disabled={pendingId === requestId}
                      onClick={() => respond(requestId, true)}
                    >
                      Aceptar
                    </button>
                    <button
                      type="button"
                      className="notif-no"
                      disabled={pendingId === requestId}
                      onClick={() => respond(requestId, false)}
                    >
                      Rechazar
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

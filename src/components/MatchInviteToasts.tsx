"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CollectibleGlyph } from "@/components/CollectibleArt";
import { ShieldArt } from "@/components/game-art";
import { createClient } from "@/lib/supabase-browser";
import {
  cancelMatchInvite,
  myMatchInviteToasts,
  respondMatchInvite,
  type MatchInviteToast,
} from "@/app/actions/matchroom";

/**
 * Global floating match-invite notifications, fixed to the bottom-right corner
 * on every route. Live via Postgres Changes on `match_invites` (RLS scopes the
 * delivered rows to invites the user sent or received):
 * - sender sees "Invitación enviada" with an X to cancel;
 * - receiver sees the challenge with ✓ accept / ✗ decline;
 * - cancel/decline/accept anywhere makes the card vanish on BOTH ends.
 */
export function MatchInviteToasts({ userId }: { userId: string }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<MatchInviteToast[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; msg: string } | null>(null);
  const pending = useRef(false);

  const refetch = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    myMatchInviteToasts()
      .then(setToasts)
      .finally(() => {
        pending.current = false;
      });
  }, []);

  useEffect(() => {
    refetch();
    const supabase = createClient();
    const channel = supabase
      .channel(`match-invites:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_invites", filter: `receiver_id=eq.${userId}` },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_invites", filter: `sender_id=eq.${userId}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  const cancel = async (inviteId: string) => {
    setActingId(inviteId);
    await cancelMatchInvite(inviteId);
    setActingId(null);
    refetch();
  };

  const respond = async (toast: MatchInviteToast, accept: boolean) => {
    setActingId(toast.inviteId);
    const res = await respondMatchInvite(toast.inviteId, accept);
    setActingId(null);
    if (accept && res.ok && res.code) {
      router.push(`/jugar/amistoso/${res.code}`);
    } else if (accept && !res.ok) {
      setError({ id: toast.inviteId, msg: res.error ?? "La sala ya no está disponible." });
      setTimeout(() => setError(null), 2600);
    }
    refetch();
  };

  if (toasts.length === 0) return null;

  return (
    <div className="mi-toasts" role="region" aria-label="Invitaciones de partido">
      {toasts.map((t) => {
        const busy = actingId === t.inviteId;
        const failed = error?.id === t.inviteId;
        return t.direction === "in" ? (
          <div className="mi-card in" key={t.inviteId}>
            <span className="mi-crest">
              {t.player.art ? <CollectibleGlyph c={t.player.art} /> : <ShieldArt id={null} />}
            </span>
            <div className="mi-tx">
              <small>DESAFÍO AMISTOSO</small>
              <b>{t.player.president}</b>
              <span>
                te invita a un enfrentamiento
                {t.gameName ? ` · ${t.gameName}` : ""}
              </span>
              {failed && <em className="mi-err" role="alert">{error.msg}</em>}
            </div>
            <div className="mi-acts">
              <button
                className="mi-yes"
                disabled={busy}
                aria-label={`Aceptar el desafío de ${t.player.president}`}
                onClick={() => respond(t, true)}
              >
                ✓
              </button>
              <button
                className="mi-no"
                disabled={busy}
                aria-label={`Rechazar el desafío de ${t.player.president}`}
                onClick={() => respond(t, false)}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="mi-card out" key={t.inviteId}>
            <span className="mi-crest">
              {t.player.art ? <CollectibleGlyph c={t.player.art} /> : <ShieldArt id={null} />}
            </span>
            <div className="mi-tx">
              <small>
                <span className="mi-dot" /> INVITACIÓN ENVIADA
              </small>
              <b>{t.player.president}</b>
              <span>esperando respuesta…</span>
            </div>
            <div className="mi-acts">
              <button
                className="mi-no"
                disabled={busy}
                aria-label={`Cancelar la invitación a ${t.player.president}`}
                onClick={() => cancel(t.inviteId)}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

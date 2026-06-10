"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase-browser";

/**
 * Global online presence. Joins a shared "online" channel keyed by the user's
 * id, tracks the current user as present, and returns the set of online user
 * ids. Used to show friends' "En línea / Desconectado" state in real time.
 *
 * Pass `null` when there's no authenticated user (returns an empty set and
 * skips the subscription).
 */
export function usePresence(userId: string | null): Set<string> {
  const [online, setOnline] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase.channel("online", {
      config: { presence: { key: userId } },
    });

    const sync = () => {
      // presenceState() is keyed by each member's presence key (the user id).
      setOnline(new Set(Object.keys(channel.presenceState())));
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      // untrack is implicit on unsubscribe/disconnect.
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return online;
}

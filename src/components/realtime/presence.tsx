"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";

import { createClient } from "@/lib/supabase-browser";

/**
 * Global online presence. The provider (mounted once in the root layout) joins
 * a shared "online" Realtime channel keyed by the user's id and tracks the
 * current user as present for as long as they have an authenticated session —
 * on ANY route of the app. Consumers read the live set of online user ids via
 * `useOnline()`.
 */
const EMPTY: Set<string> = new Set();

const PresenceContext = createContext<Set<string>>(EMPTY);

export function PresenceProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
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

  // Derive instead of resetting state in the effect: signed out = nobody online.
  return <PresenceContext value={userId ? online : EMPTY}>{children}</PresenceContext>;
}

/** The set of user ids currently online anywhere in the app. */
export function useOnline(): Set<string> {
  return use(PresenceContext);
}

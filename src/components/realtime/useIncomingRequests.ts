"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase-browser";
import { myIncomingRequests } from "@/app/actions/friends";
import type { RequestCard } from "@/actions/friends";

/**
 * Live list of pending friend requests addressed to the user. Seeds from the
 * server-rendered `initial` list, then subscribes to Postgres Changes on
 * `friend_requests` filtered to `receiver_id=eq.<userId>` (RLS also restricts
 * this to the user's own rows). Any change re-fetches the enriched cards via a
 * server action, since the raw realtime payload lacks the sender's club/crest.
 *
 * Returns the current list plus a `refetch` to call after acting on a request.
 */
export function useIncomingRequests(
  userId: string | null,
  initial: RequestCard[],
): { incoming: RequestCard[]; refetch: () => void } {
  const [incoming, setIncoming] = useState<RequestCard[]>(initial);
  const pending = useRef(false);

  const refetch = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    myIncomingRequests()
      .then(setIncoming)
      .finally(() => {
        pending.current = false;
      });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`friend-requests:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${userId}`,
        },
        () => refetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  return { incoming, refetch };
}

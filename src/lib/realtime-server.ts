// Server-side Realtime Broadcast publisher. Postgres Changes proved fragile
// for cross-client delivery (RLS over the WAL stream), so mutations announce
// themselves explicitly: after writing, the server action pings the affected
// broadcast topics and every subscribed client re-fetches via server actions.
// Sends go over the Realtime HTTP endpoint (no websocket needed server-side).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { invitesTopicFor, roomTopicFor, SYNC_EVENT } from "@/lib/realtime-topics";

let admin: SupabaseClient | undefined;

function adminClient(): SupabaseClient {
  if (!admin) {
    admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return admin;
}

async function broadcast(topic: string): Promise<void> {
  const client = adminClient();
  const channel = client.channel(topic);
  try {
    // Explicit REST delivery (no websocket needed on the server).
    await channel.httpSend(SYNC_EVENT, { at: Date.now() });
  } catch {
    // Delivery is best-effort; a mutation must never fail because of a ping.
  } finally {
    client.removeChannel(channel);
  }
}

/** Ping each user's invite channel (toasts re-fetch). */
export async function notifyInvites(userIds: Iterable<string>): Promise<void> {
  await Promise.all([...new Set(userIds)].map((id) => broadcast(invitesTopicFor(id))));
}

/** Ping a room's lobby channel (both seats re-fetch). */
export async function notifyRooms(roomIds: Iterable<string>): Promise<void> {
  await Promise.all([...new Set(roomIds)].map((id) => broadcast(roomTopicFor(id))));
}

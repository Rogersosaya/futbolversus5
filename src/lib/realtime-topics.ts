// Shared Realtime Broadcast topic names (client-safe — no keys here).
// Server actions publish "sync" pings on these topics after each mutation;
// clients subscribed to them re-fetch their data through server actions, so
// the payload never carries private data.

/** Per-user channel for match-invite changes (sent or received). */
export const invitesTopicFor = (userId: string) => `invites:${userId}`;

/** Per-room channel for lobby changes (seat taken/freed, closed, invites). */
export const roomTopicFor = (roomId: string) => `room:${roomId}`;

/** The broadcast event name used on both topics. */
export const SYNC_EVENT = "sync";

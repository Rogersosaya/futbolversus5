import Link from "next/link";

const COPY = {
  closed: {
    title: "SALA NO DISPONIBLE",
    sub: "Esta sala ya no existe o el anfitrión la cerró.",
  },
  full: {
    title: "SALA COMPLETA",
    sub: "Otro presidente ya ocupó el lugar de rival en esta sala.",
  },
} as const;

/** Full-screen block shown when the room can't be entered (closed, full, or a
 * manipulated code). Server component — no realtime needed here. */
export function RoomUnavailable({ reason }: { reason: keyof typeof COPY }) {
  const { title, sub } = COPY[reason];
  return (
    <div className="lobby-layer on">
      <div className="lobby amistoso">
        <div className="bg">
          <div className="streaks" />
          <div className="vignette" />
        </div>
        <div className="room-msg">
          <span className="ctx-tag">PARTIDO AMISTOSO</span>
          <div className="ctx-title">{title}</div>
          <div className="ctx-sub">{sub}</div>
          <Link href="/amistoso" className="btn-play sm room-msg-cta">
            VOLVER A AMISTOSOS
          </Link>
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";

/** Legacy entry point. Rooms are now created from /amistoso (JUGAR) and live
 * at /jugar/amistoso/[code]. */
export default function AmistosoMatchmakingPage() {
  redirect("/amistoso");
}

import { redirect } from "next/navigation";

import { getAuthUserId } from "@/actions/profile";
import { getMatchmakingData } from "@/actions/friends";

import { MatchmakingView } from "./MatchmakingView";

/** Amistoso matchmaking room: own club + invite a friend / share link.
 * Full-screen route reached from /amistoso → JUGAR. */
export default async function AmistosoMatchmakingPage({
  searchParams,
}: {
  searchParams: Promise<{ juego?: string; dif?: string }>;
}) {
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");

  const data = await getMatchmakingData(userId);
  if (!data?.me) redirect("/amistoso");

  const { dif } = await searchParams;

  return (
    <MatchmakingView
      userId={userId}
      me={data.me}
      friends={data.friends}
      inviteCode={data.inviteCode}
      difficulty={dif ?? null}
    />
  );
}

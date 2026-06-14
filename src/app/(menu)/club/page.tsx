import { redirect } from "next/navigation";

import { getAuthUserId } from "@/actions/profile";
import { getMatchHistory } from "@/actions/history";

import { ClubView } from "./ClubView";

/** Mi Club — identity, KPIs and the real played-matches history from the DB. */
export default async function ClubPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/login?next=/club");

  const history = await getMatchHistory(userId);
  return <ClubView history={history} />;
}

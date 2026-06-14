import { getGames } from "@/actions/games";
import { AmistosoView } from "./AmistosoView";

export default async function AmistosoPage() {
  const games = await getGames();
  return <AmistosoView games={games} />;
}

import { createServerClient } from "@/lib/supabase-server";
import type { Game } from "@/generated/prisma/client";
import { AmistosoView } from "./AmistosoView";

export default async function AmistosoPage() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("Game")
    .select("*")
    .order("id");

  if (error) throw new Error(error.message);

  return <AmistosoView games={(data ?? []) as Game[]} />;
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteDraftEvolutions(ids: string[]) {
  if (!ids.length) return;
  const supabase = await createClient();
  await supabase
    .from("evolutions")
    .delete()
    .in("id", ids)
    .eq("status", "draft");
  revalidatePath("/terapeuta/evolucoes");
}

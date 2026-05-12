"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePublicarNota(
  evoId: string,
  publicadoAtual: boolean,
  patientId: string
) {
  const supabase = await createClient();
  await supabase
    .from("evolutions")
    .update({ published_to_family: !publicadoAtual })
    .eq("id", evoId);
  revalidatePath(`/terapeuta/pacientes/${patientId}`);
}

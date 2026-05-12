"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePublicarNota(
  noteId: string,
  publicadoAtual: boolean,
  patientId: string
) {
  const supabase = await createClient();
  await supabase
    .from("multidisciplinary_notes")
    .update({ published_to_family: !publicadoAtual })
    .eq("id", noteId);
  revalidatePath(`/terapeuta/pacientes/${patientId}`);
}

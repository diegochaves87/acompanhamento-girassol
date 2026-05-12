import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const { patient_id, tenant_id, technical_note } = body as {
    patient_id: string;
    tenant_id?: string;
    technical_note: string;
  };

  if (!patient_id || !technical_note?.trim()) {
    return Response.json(
      { error: "patient_id e technical_note são obrigatórios." },
      { status: 400 }
    );
  }

  const insertPayload: Record<string, unknown> = {
    patient_id,
    author_id: user.id,
    technical_note: technical_note.trim(),
    context_type: "nota_interna",
  };
  if (tenant_id) insertPayload.tenant_id = tenant_id;

  const { data, error } = await supabase
    .from("multidisciplinary_notes")
    .insert(insertPayload)
    .select("id, technical_note, created_at")
    .single();

  if (error) {
    console.error("[/api/notas] Erro no INSERT:", JSON.stringify(error));
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

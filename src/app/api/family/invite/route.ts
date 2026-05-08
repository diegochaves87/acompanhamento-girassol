import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json() as {
    patient_id: string;
    nome: string;
    email?: string | null;
    relacao?: string | null;
  };
  const { patient_id, nome, email, relacao } = body;

  if (!patient_id || !nome?.trim()) {
    return Response.json({ error: "patient_id e nome são obrigatórios" }, { status: 400 });
  }

  // Verifica que o paciente pertence ao tenant do terapeuta autenticado
  const { data: patient, error: patientErr } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patient_id)
    .maybeSingle();

  if (patientErr || !patient) {
    return Response.json({ error: "Paciente não encontrado ou sem permissão" }, { status: 403 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("family_access")
    .insert({
      patient_id,
      nome: nome.trim(),
      email: email?.trim().toLowerCase() || null,
      relacao: relacao || null,
    })
    .select("invite_token")
    .single();

  if (error) {
    console.error("[family/invite] insert error:", error.message, error.code);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

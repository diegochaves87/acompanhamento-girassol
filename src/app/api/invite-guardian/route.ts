import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { guardian_email, guardian_name, patient_id } = await request.json();

  if (!guardian_email || !patient_id) {
    return NextResponse.json({ error: "guardian_email e patient_id são obrigatórios" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(guardian_email, {
    data: { full_name: guardian_name, role: "family" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Marca convite enviado em family_patient
  await supabaseAdmin
    .from("family_patient")
    .update({ invited_at: new Date().toISOString() })
    .eq("patient_id", patient_id)
    .eq("guardian_email", guardian_email);

  return NextResponse.json({ ok: true });
}

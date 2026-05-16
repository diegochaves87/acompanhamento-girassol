import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    const tenantId = (userData as { tenant_id?: string } | null)?.tenant_id;
    if (!tenantId) return NextResponse.json({ inserted: 0 });

    const { data: patients } = await supabase
      .from("patients")
      .select("id, full_name, tenant_id")
      .eq("tenant_id", tenantId)
      .or("cpf.is.null,cpf.eq.");

    let inserted = 0;

    for (const patient of (patients ?? []) as { id: string; full_name: string }[]) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("type", "cpf_missing")
        .eq("resolved", false)
        .maybeSingle();

      if (!existing) {
        await supabase.from("notifications").insert({
          tenant_id: tenantId,
          type: "cpf_missing",
          patient_id: patient.id,
          message: `Paciente ${patient.full_name} está sem CPF — compartilhamento familiar bloqueado.`,
          action_url: `/terapeuta/pacientes/${patient.id}?aba=dados`,
        });
        inserted++;
      }
    }

    return NextResponse.json({ inserted });
  } catch (err) {
    console.error("[/api/notifications/check]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

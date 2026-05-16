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
    console.log("[notifications/check] tenant_id encontrado:", tenantId);
    if (!tenantId) return NextResponse.json({ inserted: 0 });

    const { data: patients } = await supabase
      .from("patients")
      .select("id, full_name, cpf")
      .eq("tenant_id", tenantId);

    const withoutCpf = (patients ?? []).filter((p: { cpf?: string | null }) => {
      const cpf = p.cpf?.trim() ?? "";
      return cpf === "" || cpf === '""';
    });

    console.log("[notifications/check] total pacientes:", patients?.length, "sem CPF:", withoutCpf.length);

    let inserted = 0;

    for (const patient of withoutCpf as { id: string; full_name: string }[]) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("tipo", "cpf_missing")
        .eq("lida", false)
        .maybeSingle();

      if (!existing) {
        const msg = `Paciente ${patient.full_name} está sem CPF — compartilhamento familiar bloqueado.`;
        const { data: insertedData, error: insertError } = await supabase
          .from("notifications")
          .insert({
            tenant_id: tenantId,
            tipo: "cpf_missing",
            type: "cpf_missing",
            titulo: "CPF ausente",
            patient_id: patient.id,
            mensagem: msg,
            message: msg,
            action_url: `/terapeuta/pacientes/${patient.id}?aba=dados`,
            lida: false,
            resolved: false,
          })
          .select();
        console.log("INSERT result:", insertedData, "INSERT error:", insertError);
        if (!insertError) inserted++;
      }
    }

    console.log("[notifications/check] notificações inseridas:", inserted);
    return NextResponse.json({ inserted, total_without_cpf: withoutCpf.length, tenant_id: tenantId });
  } catch (err) {
    console.error("[notifications/check] erro:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

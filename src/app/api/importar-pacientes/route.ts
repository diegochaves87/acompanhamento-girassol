import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type PlanilhaRow = {
  nome_completo: string;
  data_nascimento: string;
  diagnostico: string;
  nome_responsavel: string;
  telefone_responsavel: string;
  email_responsavel: string;
  parentesco: string;
  clinica: string;
  tipo_pagamento: string;
  valor_sessao: string;
  convenio: string;
  cpf: string;
  observacoes: string;
  _linha: number;
};

type ResultadoItem = {
  linha: number;
  nome: string;
  status: "ok" | "erro";
  mensagem?: string;
};

export async function POST(request: Request) {
  const { rows } = (await request.json()) as { rows: PlanilhaRow[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Nenhuma linha recebida." }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData?.tenant_id) {
    return NextResponse.json({ error: "tenant_id não encontrado." }, { status: 400 });
  }

  const tenantId = userData.tenant_id;

  // Carrega todas as clínicas do tenant para resolver nome → id
  const { data: clinicas } = await supabase
    .from("clinics")
    .select("id, name")
    .eq("tenant_id", tenantId);

  const clinicaMap = new Map<string, string>();
  (clinicas ?? []).forEach((c: { id: string; name: string }) => {
    clinicaMap.set(c.name.toLowerCase().trim(), c.id);
  });

  const results: ResultadoItem[] = [];

  for (const row of rows) {
    const nome = row.nome_completo.trim();
    if (!nome) continue;

    // Resolve clinic_id pelo nome fantasia
    let clinic_id: string | null = null;
    if (row.clinica?.trim()) {
      clinic_id = clinicaMap.get(row.clinica.toLowerCase().trim()) ?? null;
      if (!clinic_id) {
        results.push({
          linha: row._linha,
          nome,
          status: "erro",
          mensagem: `Clínica "${row.clinica}" não encontrada`,
        });
        continue;
      }
    }

    // CPF — remove máscara e valida tamanho
    const cpf = row.cpf ? row.cpf.replace(/\D/g, "") : null;
    const cpfValido = cpf && cpf.length === 11 ? cpf : null;

    // Verifica CPF duplicado
    if (cpfValido) {
      const { data: existente } = await supabase
        .from("patients")
        .select("id")
        .eq("cpf", cpfValido)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existente) {
        results.push({
          linha: row._linha,
          nome,
          status: "erro",
          mensagem: "CPF já cadastrado",
        });
        continue;
      }
    }

    // Normaliza tipo de pagamento
    const paymentTypeRaw = (row.tipo_pagamento ?? "").toLowerCase().trim();
    const payment_type = paymentTypeRaw.includes("conv") ? "convenio" : "particular";

    // Valor por sessão
    const valorRaw = String(row.valor_sessao ?? "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const value_per_session_brl = valorRaw ? parseFloat(valorRaw) : null;

    // Diagnóstico — split por vírgula
    const diagnosis = row.diagnostico
      ? row.diagnostico
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      : [];

    // Insere paciente
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        tenant_id: tenantId,
        full_name: nome,
        cpf: cpfValido,
        birth_date: row.data_nascimento || null,
        diagnosis,
        clinic_id,
        payment_type,
        value_per_session_brl: isNaN(value_per_session_brl as number)
          ? null
          : value_per_session_brl,
        insurance_name:
          payment_type === "convenio" ? row.convenio?.trim() || null : null,
        notes: row.observacoes?.trim() || null,
      })
      .select("id")
      .single();

    if (patientError) {
      results.push({
        linha: row._linha,
        nome,
        status: "erro",
        mensagem: patientError.message,
      });
      continue;
    }

    // Insere responsável se informado
    if (row.nome_responsavel?.trim()) {
      const { error: familyError } = await supabase.from("family_patient").insert({
        patient_id: patient.id,
        guardian_name: row.nome_responsavel.trim(),
        guardian_phone: row.telefone_responsavel?.trim() || null,
        guardian_email: row.email_responsavel?.trim() || null,
        guardian_relationship: row.parentesco?.trim() || null,
      });

      if (familyError) {
        results.push({
          linha: row._linha,
          nome,
          status: "erro",
          mensagem: `Paciente salvo, mas erro no responsável: ${familyError.message}`,
        });
        continue;
      }
    }

    results.push({ linha: row._linha, nome, status: "ok" });
  }

  return NextResponse.json({ results });
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const TIPO_PROMPTS: Record<string, string> = {
  evolucao:
    "Você é um terapeuta experiente. Redija um relatório de evolução terapêutica formal em português brasileiro, estruturado com seções: Identificação, Período, Objetivos Terapêuticos, Evolução Clínica, Conclusão. Use linguagem técnica e profissional.",
  escolar:
    "Você é um terapeuta experiente. Redija um relatório escolar formal em português brasileiro, para ser encaminhado à escola do paciente. Estruture com: Identificação, Período, Área de Atuação, Observações do Desenvolvimento, Recomendações para a Escola. Use linguagem acessível mas profissional.",
  laudo:
    "Você é um terapeuta experiente. Redija um laudo clínico formal em português brasileiro, com as seções: Dados de Identificação, Motivo do Encaminhamento, Histórico, Avaliação, Conclusão e CID-10. Use linguagem técnica precisa.",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { patient_id, tipo, periodo_inicio, periodo_fim } = (await req.json()) as {
    patient_id: string;
    tipo: string;
    periodo_inicio: string;
    periodo_fim: string;
  };

  console.log("[/api/relatorio] patient_id recebido:", patient_id, "tipo:", tipo);

  if (!patient_id || !tipo || !periodo_inicio || !periodo_fim) {
    return Response.json({ error: "Parâmetros incompletos." }, { status: 400 });
  }

  const patientRes = await supabase
    .from("patients")
    .select("full_name, diagnosis, birth_date, support_level")
    .eq("id", patient_id)
    .maybeSingle();

  if (patientRes.error) {
    console.error("[/api/relatorio] Erro ao buscar paciente:", JSON.stringify(patientRes.error));
    return Response.json({ error: `Erro ao buscar paciente: ${patientRes.error.message}` }, { status: 500 });
  }

  const patient = patientRes.data;
  if (!patient) {
    console.error("[/api/relatorio] Paciente não encontrado para id:", patient_id);
    return Response.json({ error: "Paciente não encontrado. Verifique se o id está correto e se o usuário tem acesso a esse paciente." }, { status: 404 });
  }

  const [sessoesRes, notasRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("scheduled_at, status, duration_minutes")
      .eq("patient_id", patient_id)
      .gte("scheduled_at", periodo_inicio + "T00:00:00")
      .lte("scheduled_at", periodo_fim + "T23:59:59")
      .order("scheduled_at"),
    supabase
      .from("multidisciplinary_notes")
      .select("technical_note, created_at, context_type")
      .eq("patient_id", patient_id)
      .gte("created_at", periodo_inicio)
      .lte("created_at", periodo_fim + "T23:59:59")
      .order("created_at"),
  ]);

  const sessoes = sessoesRes.data ?? [];
  const notas = notasRes.data ?? [];

  const statusLabel: Record<string, string> = {
    scheduled: "Agendada",
    confirmed: "Confirmada",
    completed: "Realizada",
    cancelled: "Cancelada",
    canceled_therapist: "Cancelada pelo terapeuta",
    cancelled_family: "Cancelada pela família",
    unjustified_absence: "Falta injustificada",
    justified_absence: "Falta justificada",
    makeup: "Reposição",
    holiday: "Feriado",
  };

  const diasSessao = sessoes
    .map(
      (s) =>
        `  - ${new Date(s.scheduled_at).toLocaleDateString("pt-BR")}: ${statusLabel[s.status] ?? s.status}${s.duration_minutes ? ` (${s.duration_minutes} min)` : ""}`
    )
    .join("\n");

  const notasTexto = notas
    .map(
      (n) =>
        `  [${new Date(n.created_at).toLocaleDateString("pt-BR")}] ${n.technical_note}`
    )
    .join("\n\n");

  const contexto = `
Paciente: ${patient.full_name}
Data de nascimento: ${patient.birth_date ? new Date(patient.birth_date + "T00:00:00").toLocaleDateString("pt-BR") : "N/A"}
Diagnóstico: ${(patient.diagnosis as string[] | null)?.join(", ") ?? "N/A"}
Nível de suporte: ${(patient as Record<string, unknown>).support_level ?? "N/A"}
Período do relatório: ${new Date(periodo_inicio + "T00:00:00").toLocaleDateString("pt-BR")} a ${new Date(periodo_fim + "T00:00:00").toLocaleDateString("pt-BR")}

Sessões no período (${sessoes.length} total):
${diasSessao || "  Nenhuma sessão registrada no período."}

Anotações clínicas do terapeuta:
${notasTexto || "  Nenhuma anotação registrada no período."}
`.trim();

  const systemPrompt = TIPO_PROMPTS[tipo] ?? TIPO_PROMPTS.evolucao;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Com base nos dados a seguir, elabore o relatório:\n\n${contexto}`,
        },
      ],
    });

    const block = msg.content[0];
    if (block.type !== "text") {
      return Response.json({ error: "Resposta inesperada da IA." }, { status: 500 });
    }

    return Response.json({ texto: block.text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[/api/relatorio] Anthropic error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

function primeiroUltimo(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName.trim();
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function artigoPaciente(sexo: string): string {
  if (sexo === "masculino") return "do";
  if (sexo === "feminino") return "da";
  return "de";
}

type Trio = [string, string, string]; // [masc, fem, neutro]

const TITULO_MAP: Record<string, Trio> = {
  "fisioterapia":        ["fisioterapeuta",        "fisioterapeuta",         "fisioterapeuta"],
  "fonoaudiologia":      ["fonoaudiólogo",          "fonoaudióloga",          "fonoaudiólogo(a)"],
  "psicologia":          ["psicólogo",              "psicóloga",              "psicólogo(a)"],
  "terapia ocupacional": ["terapeuta ocupacional",  "terapeuta ocupacional",  "terapeuta ocupacional"],
  "psiquiatria":         ["psiquiatra",             "psiquiatra",             "psiquiatra"],
  "neuropsicologia":     ["neuropsicólogo",         "neuropsicóloga",         "neuropsicólogo(a)"],
  "psicopedagogia":      ["psicopedagogo",          "psicopedagoga",          "psicopedagogo(a)"],
  "educação física":     ["educador físico",        "educadora física",       "educador(a) físico(a)"],
  "nutrição":            ["nutricionista",          "nutricionista",          "nutricionista"],
  "pedagogia":           ["pedagogo",               "pedagoga",               "pedagogo(a)"],
  "medicina":            ["médico",                 "médica",                 "médico(a)"],
};

function tituloProf(formacao: string | null, sexoTerapeuta: string): string | null {
  if (!formacao) return null;
  const entry = TITULO_MAP[formacao.trim().toLowerCase()];
  if (!entry) return formacao;
  if (sexoTerapeuta === "masculino") return entry[0];
  if (sexoTerapeuta === "feminino") return entry[1];
  return entry[2];
}

function evolucaoRef(relacao: string | null | undefined, sexo: string, primeiroNome: string): string {
  const rel = relacao?.toLowerCase().trim() ?? "";
  const masc = sexo === "masculino";
  const fem = sexo === "feminino";

  if (rel === "mãe" || rel === "mae" || rel === "pai") {
    if (masc) return `do seu filho ${primeiroNome}`;
    if (fem) return `da sua filha ${primeiroNome}`;
    return `do(a) seu(ua) filho(a) ${primeiroNome}`;
  }
  if (rel === "avó" || rel === "avo" || rel === "avô") {
    if (masc) return `do seu neto ${primeiroNome}`;
    if (fem) return `da sua neta ${primeiroNome}`;
    return `do(a) seu(ua) neto(a) ${primeiroNome}`;
  }
  if (rel === "irmão" || rel === "irmao" || rel === "irmã" || rel === "irma") {
    if (masc) return `do seu irmão ${primeiroNome}`;
    if (fem) return `da sua irmã ${primeiroNome}`;
    return `do(a) seu(ua) irmão(ã) ${primeiroNome}`;
  }

  return `${artigoPaciente(sexo)} ${primeiroNome}`;
}

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

  const { data: patient, error: patientErr } = await supabase
    .from("patients")
    .select("id, full_name, sexo")
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

  const [terapeutaRes, profileRes, sessionRes] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("formacoes, especialidades, sexo").eq("id", user.id).maybeSingle(),
    supabase
      .from("sessions")
      .select("clinics(name)")
      .eq("patient_id", patient_id)
      .not("clinic_id", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const terapeutaFullName = terapeutaRes.data?.full_name ?? "";
  const formacoes = profileRes.data?.formacoes as Array<{ name: string }> | null;
  const especialidades = profileRes.data?.especialidades as Array<{ name: string }> | null;
  const sexoTerapeuta = (profileRes.data?.sexo as string | null) ?? "nao_informado";
  const clinicaData = sessionRes.data as { clinics?: { name: string } | null } | null;
  const clinicaNome = clinicaData?.clinics?.name ?? null;

  const terapeutaPN = terapeutaFullName ? primeiroUltimo(terapeutaFullName) : "seu terapeuta";
  const pacienteFullName = (patient as { full_name?: string }).full_name ?? "paciente";
  const pacientePN = primeiroUltimo(pacienteFullName);
  const primeiroPaciente = pacienteFullName.trim().split(/\s+/)[0];
  const sexoPaciente = (patient as { sexo?: string }).sexo ?? "nao_informado";
  const primeiroFamiliar = nome.trim().split(/\s+/)[0];

  const titulo = tituloProf(formacoes?.[0]?.name ?? null, sexoTerapeuta);
  const especialidade = especialidades?.[0]?.name ?? null;
  const artigo = artigoPaciente(sexoPaciente);
  const evolucao = evolucaoRef(relacao, sexoPaciente, primeiroPaciente);

  const tituloPart = titulo ? `, ${titulo} ${artigo} ${pacientePN}` : "";
  const especialidadePart = especialidade ? ` em ${especialidade}` : "";
  const clinicaPart = clinicaNome
    ? `${tituloPart}, responsável pelos atendimentos${especialidadePart} realizados na ${clinicaNome}`
    : tituloPart;
  const primeiraSentenca = `Sou ${terapeutaPN}${clinicaPart}.`;

  const wa_message_template =
    `Olá, ${primeiroFamiliar}, tudo bem contigo? Espero que sim.\n\n` +
    `${primeiraSentenca}\n\n` +
    `Quero te convidar para acompanhar a evolução ${evolucao} pelo *Acompanhamento Girassol*, uma plataforma gratuita que te mantém sempre por dentro de cada sessão.\n\n` +
    `Acesse pelo link e saiba mais: {link}\n\n` +
    `Qualquer dúvida estou por aqui.\nAbraço!`;

  return Response.json({ ...data, wa_message_template });
}

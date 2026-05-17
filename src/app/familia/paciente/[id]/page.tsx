import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import PacientePortal, { type Evolucao, type Relatorio } from "./PacientePortal";

type Props = { params: { id: string } };

export default async function PacientePortalPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/familia/login");

  const isDev = user.email === "dcchaves25@gmail.com";

  // Verificar acesso familiar ao paciente
  if (!isDev) {
    const { data: access } = await supabase
      .from("family_access")
      .select("id")
      .eq("email", user.email!)
      .eq("patient_id", params.id)
      .eq("status", "ativo")
      .maybeSingle();
    if (!access) redirect("/familia/dashboard");
  }

  // Cliente com privilégios para dev, cliente normal para familiares
  const db = isDev
    ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : supabase;

  // Dados do paciente
  const { data: patient } = await db
    .from("patients")
    .select("id, full_name, foto_url, diagnosis, cpf")
    .eq("id", params.id)
    .maybeSingle();

  if (!patient) notFound();

  // Evoluções publicadas para família + relatórios humanizados (em paralelo)
  const [evolRes, relRes] = await Promise.all([
    db
      .from("evolutions")
      .select("id, family_text, published_at, tenant_id")
      .eq("patient_id", params.id)
      .eq("published_to_family", true)
      .order("published_at", { ascending: false }),
    db
      .from("relatorios")
      .select("id, titulo, conteudo_humanizado, created_at, author_id, periodo_inicio, periodo_fim")
      .eq("patient_id", params.id)
      .not("conteudo_humanizado", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  // Buscar informações dos terapeutas para evoluções (por tenant_id)
  const tenantIds = Array.from(new Set((evolRes.data ?? []).map((e: { tenant_id: string }) => e.tenant_id).filter(Boolean)));
  const authorIds = Array.from(new Set((relRes.data ?? []).map((r: { author_id: string }) => r.author_id).filter(Boolean)));

  type UserRow      = { id: string; tenant_id: string; full_name: string };
  type ProfileRow   = { id: string; especialidades: Array<{ name: string }> | null; foto_url: string | null };

  const therapistByTenant: Record<string, { nome: string; espec: string | null; foto: string | null }> = {};
  const nomeByUser: Record<string, string> = {};

  if (tenantIds.length > 0) {
    const { data: tUsers } = await db
      .from("users")
      .select("id, tenant_id, full_name")
      .in("tenant_id", tenantIds);

    if (tUsers && tUsers.length > 0) {
      const uIds = (tUsers as UserRow[]).map((u) => u.id);
      const { data: profs } = await db
        .from("profiles")
        .select("id, especialidades, foto_url")
        .in("id", uIds);
      const profMap: Record<string, ProfileRow> = {};
      for (const p of (profs ?? []) as ProfileRow[]) profMap[p.id] = p;

      for (const u of tUsers as UserRow[]) {
        const prof = profMap[u.id];
        therapistByTenant[u.tenant_id] = {
          nome:  u.full_name,
          espec: prof?.especialidades?.[0]?.name ?? null,
          foto:  prof?.foto_url ?? null,
        };
      }
    }
  }

  if (authorIds.length > 0) {
    const { data: authors } = await db
      .from("users")
      .select("id, full_name")
      .in("id", authorIds);
    for (const a of (authors ?? []) as { id: string; full_name: string }[]) {
      nomeByUser[a.id] = a.full_name;
    }
  }

  const evolucoes: Evolucao[] = (evolRes.data ?? []).map((e: {
    id: string; family_text: string | null; published_at: string | null; tenant_id: string;
  }, idx: number) => ({
    id:            e.id,
    texto:         e.family_text ?? "",
    publishedAt:   e.published_at ?? "",
    terapeutaNome: therapistByTenant[e.tenant_id]?.nome ?? "Terapeuta",
    terapeutaEspec: therapistByTenant[e.tenant_id]?.espec ?? null,
    terapeutaFoto:  therapistByTenant[e.tenant_id]?.foto ?? null,
    colorIndex:    idx,
  }));

  const relatorios: Relatorio[] = (relRes.data ?? []).map((r: {
    id: string; titulo: string | null; conteudo_humanizado: string | null;
    created_at: string | null; author_id: string;
    periodo_inicio?: string | null; periodo_fim?: string | null;
  }) => ({
    id:            r.id,
    titulo:        r.titulo ?? "Relatório",
    conteudo:      r.conteudo_humanizado ?? "",
    createdAt:     r.created_at ?? "",
    terapeutaNome: nomeByUser[r.author_id] ?? "Terapeuta",
    periodoInicio: r.periodo_inicio ?? null,
    periodoFim:    r.periodo_fim ?? null,
  }));

  return (
    <PacientePortal
      patientId={params.id}
      patientNome={patient.full_name}
      patientFoto={(patient as { foto_url?: string | null }).foto_url ?? null}
      evolucoes={evolucoes}
      relatorios={relatorios}
    />
  );
}

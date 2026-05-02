import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import NovaEvolucaoForm from "./NovaEvolucaoForm";

type Props = {
  searchParams: { sessao?: string; evolution?: string };
};

function formatSessionDate(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  const weekdays = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];
  const weekday = weekdays[d.getUTCDay()];
  const date = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${weekday}, ${date} às ${time}`;
}

export default async function NovaEvolucaoPage({ searchParams }: Props) {
  const sessaoId = searchParams.sessao;
  const evolutionParamId = searchParams.evolution;
  if (!sessaoId) redirect("/terapeuta/evolucoes");

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, scheduled_at, patient_id, tenant_id, status, clinics(name)")
    .eq("id", sessaoId)
    .maybeSingle();

  if (!session) notFound();

  // Fetch existing evolution: prefer explicit evolution ID param, fall back to session lookup
  const evoQuery = evolutionParamId
    ? supabase
        .from("evolutions")
        .select("id, technical_text, family_text, status")
        .eq("id", evolutionParamId)
        .maybeSingle()
    : supabase
        .from("evolutions")
        .select("id, technical_text, family_text, status")
        .eq("session_id", sessaoId)
        .maybeSingle();

  const [patientRes, guardianRes, evolutionRes] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name")
      .eq("id", session.patient_id)
      .maybeSingle(),
    supabase
      .from("family_patient")
      .select("guardian_name, guardian_relationship")
      .eq("patient_id", session.patient_id)
      .maybeSingle(),
    evoQuery,
  ]);

  const patient = patientRes.data;
  const guardian = guardianRes.data;
  const existing = evolutionRes.data as {
    id: string;
    technical_text: string | null;
    family_text: string | null;
    status: string;
  } | null;

  console.log("[NovaEvolucaoPage] sessaoId:", sessaoId, "evolutionParamId:", evolutionParamId);
  console.log("[NovaEvolucaoPage] existing:", existing);

  const isEditing = !!existing;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/terapeuta/evolucoes"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors mb-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Evoluções
          </Link>
          <h1 className="text-white font-semibold text-lg">
            {isEditing ? "Editar evolução" : "Registrar evolução"}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        <NovaEvolucaoForm
          sessionId={sessaoId}
          patientId={session.patient_id}
          tenantId={session.tenant_id as string}
          patientName={patient?.full_name ?? "Paciente"}
          sessionDate={formatSessionDate(session.scheduled_at)}
          clinicName={(session.clinics as { name?: string } | null)?.name ?? null}
          guardianName={guardian?.guardian_name ?? null}
          guardianRelationship={guardian?.guardian_relationship ?? null}
          existingEvolutionId={existing?.id}
          existingTechnicalText={existing?.technical_text ?? undefined}
          existingFamilyText={existing?.family_text ?? undefined}
        />
      </main>
    </div>
  );
}

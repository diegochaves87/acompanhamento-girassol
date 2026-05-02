import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { statusLabel, statusClassName } from "@/lib/session-status";
import CancelarRecorrenciaButton from "./CancelarRecorrenciaButton";

type Props = { params: { id: string; sessaoId: string } };

type SessaoDetalhe = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  absence_note: string | null;
  is_recurring: boolean | null;
  recurrence_id: string | null;
  clinics: { name: string } | null;
  patients: { id: string; full_name: string } | null;
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatScheduledAt(scheduledAt: string) {
  const d = new Date(scheduledAt);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(scheduledAt: string) {
  const d = new Date(scheduledAt);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function formatDateLabel(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

export default async function SessaoPerfilPage({ params }: Props) {
  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from("sessions")
    .select(
      "id, scheduled_at, duration_minutes, status, absence_note, is_recurring, recurrence_id, clinics(name), patients(id, full_name)"
    )
    .eq("id", params.sessaoId)
    .single();

  if (error || !raw) notFound();

  const sessao = raw as unknown as SessaoDetalhe;

  const today = todayISO();
  const sessionDateISO = sessao.scheduled_at.slice(0, 10);
  const ehFutura = sessionDateISO >= today && sessao.status === "scheduled";

  const [futurasRes, evolutionRes] = await Promise.all([
    sessao.is_recurring && sessao.recurrence_id && ehFutura
      ? supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("recurrence_id", sessao.recurrence_id)
          .eq("status", "scheduled")
          .gte("scheduled_at", sessao.scheduled_at)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("evolutions")
      .select("id")
      .eq("session_id", params.sessaoId)
      .maybeSingle(),
  ]);

  const futurasCount = futurasRes.count ?? 0;
  const evolution = evolutionRes.data as { id: string } | null;

  const dl: { label: string; value: string }[] = [
    { label: "Data", value: formatScheduledAt(sessao.scheduled_at) },
    { label: "Horário", value: formatTime(sessao.scheduled_at) },
    ...(sessao.clinics?.name ? [{ label: "Local", value: sessao.clinics.name }] : []),
    ...(sessao.duration_minutes ? [{ label: "Duração", value: `${sessao.duration_minutes} min` }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href={`/terapeuta/pacientes/${params.id}/sessoes`}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-white font-semibold leading-tight capitalize">
              {formatScheduledAt(sessao.scheduled_at)}
            </h1>
            <p className="text-white/60 text-xs">{sessao.patients?.full_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Detalhes */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <h2 className="text-base font-semibold" style={{ color: "#1a4a3a" }}>
              Detalhes da sessão
            </h2>
            <div className="flex items-center gap-1.5">
              {sessao.is_recurring && (
                <span title="Sessão recorrente" className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClassName(sessao.status)}`}>
                {statusLabel(sessao.status)}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {dl.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-gray-400 mb-0.5">{label}</dt>
                <dd className="font-medium text-gray-800 capitalize">{value}</dd>
              </div>
            ))}
          </dl>

          {sessao.absence_note && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <dt className="text-xs text-gray-400 mb-1">Observação</dt>
              <dd className="text-sm text-gray-600 italic">{sessao.absence_note}</dd>
            </div>
          )}
        </section>

        {/* Evolução */}
        {sessao.status === "completed" && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-3 text-gray-800">Evolução</h2>
            {evolution ? (
              <Link
                href={`/terapeuta/evolucoes/${evolution.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-80 transition-opacity"
                style={{ backgroundColor: "#1a4a3a" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Evolução registrada
              </Link>
            ) : (
              <Link
                href={`/terapeuta/evolucoes/nova?sessao=${params.sessaoId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Registrar evolução
              </Link>
            )}
          </section>
        )}

        {/* Cancelar recorrência */}
        {sessao.is_recurring && futurasCount > 1 && sessao.recurrence_id && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-1 text-gray-800">
              Recorrência
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Esta sessão faz parte de uma série. Há{" "}
              <strong className="text-gray-600">{futurasCount}</strong> sessão{futurasCount !== 1 ? "ões" : ""} agendada{futurasCount !== 1 ? "s" : ""} neste grupo.
            </p>
            <CancelarRecorrenciaButton
              sessaoId={params.sessaoId}
              recurrenceId={sessao.recurrence_id}
              patientId={params.id}
              futurasCount={futurasCount}
              scheduledAt={sessao.scheduled_at}
              sessionDateLabel={formatDateLabel(sessao.scheduled_at)}
            />
          </section>
        )}

      </main>
    </div>
  );
}

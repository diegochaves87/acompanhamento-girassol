import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { statusLabel, statusClassName } from "@/lib/session-status";
import CancelarSessaoActions from "./CancelarSessaoActions";

type Props = { params: { id: string } };

type Sessao = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  value_brl: number | null;
  absence_note: string | null;
  is_recurring: boolean | null;
  recurrence_id: string | null;
  clinics: { name: string } | null;
};

function formatDate(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(scheduledAt: string) {
  return scheduledAt.slice(11, 16);
}

function formatCurrency(value: number | null) {
  if (value == null) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function SessoesPacientePage({ params }: Props) {
  const supabase = await createClient();

  const [{ data: patient }, { data: sessoes, error }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name")
      .eq("id", params.id)
      .single(),
    supabase
      .from("sessions")
      .select(
        "id, scheduled_at, duration_minutes, status, value_brl, absence_note, is_recurring, recurrence_id, clinics(name)"
      )
      .eq("patient_id", params.id)
      .order("scheduled_at", { ascending: false }),
  ]);

  if (!patient) notFound();
  if (error) console.error("[SessoesPaciente]", error.message);

  const lista: Sessao[] = (sessoes ?? []) as unknown as Sessao[];

  // Agrupa por mês
  const grupos = new Map<string, Sessao[]>();
  for (const s of lista) {
    const key = s.scheduled_at.slice(0, 7); // "YYYY-MM"
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(s);
  }

  function monthLabel(key: string) {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/terapeuta/pacientes/${params.id}`}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-white font-semibold leading-tight">Sessões</h1>
              <p className="text-white/60 text-xs">{patient.full_name}</p>
            </div>
          </div>
          <Link
            href={`/terapeuta/pacientes/${params.id}/sessoes/nova`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#ffffff", color: "#1a4a3a" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nova sessão
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-16 flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 mb-1">
              Nenhuma sessão registrada
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Registre a primeira sessão deste paciente.
            </p>
            <Link
              href={`/terapeuta/pacientes/${params.id}/sessoes/nova`}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1a4a3a" }}
            >
              Nova sessão
            </Link>
          </div>
        ) : (
          Array.from(grupos.entries()).map(([monthKey, sessoesMes]) => (
            <div key={monthKey}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 capitalize">
                {monthLabel(monthKey)}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-50">
                  {sessoesMes.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/terapeuta/pacientes/${params.id}/sessoes/${s.id}`}
                        className="block px-6 pt-4 pb-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Data + info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-semibold text-gray-800">
                                {formatDate(s.scheduled_at)}
                              </span>
                              <span className="text-sm text-gray-400">
                                {formatTime(s.scheduled_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {[
                                s.clinics?.name,
                                s.duration_minutes ? `${s.duration_minutes} min` : null,
                                formatCurrency(s.value_brl),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            {s.absence_note && (
                              <p className="text-xs text-gray-400 mt-1 italic">
                                {s.absence_note}
                              </p>
                            )}
                          </div>

                          {/* Badge + ícone recorrência */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {s.is_recurring && (
                              <span title="Sessão recorrente" className="text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </span>
                            )}
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusClassName(s.status)}`}
                            >
                              {statusLabel(s.status)}
                            </span>
                          </div>
                        </div>
                      </Link>
                      {s.status === "scheduled" && (
                        <div className="px-6 pb-3">
                          <CancelarSessaoActions
                            sessaoId={s.id}
                            isRecurring={!!s.is_recurring}
                            recurrenceId={s.recurrence_id}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

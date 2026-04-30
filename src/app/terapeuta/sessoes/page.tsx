import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { statusLabel, statusClassName } from "@/lib/session-status";

type SessaoHoje = {
  id: string;
  start_time: string | null;
  duration_minutes: number | null;
  status: string;
  patients: { id: string; full_name: string } | null;
  clinics: { name: string } | null;
};

function formatTime(time: string | null) {
  if (!time) return null;
  return time.slice(0, 5);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function SessoesHojePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const today = todayISO();

  const { data: sessoes, error } = await supabase
    .from("sessions")
    .select(
      "id, start_time, duration_minutes, status, patients(id, full_name), clinics(name)"
    )
    .eq("tenant_id", userData?.tenant_id)
    .eq("session_date", today)
    .order("start_time", { ascending: true });

  if (error) console.error("[SessoesHoje]", error.message);

  const lista: SessaoHoje[] = (sessoes ?? []) as unknown as SessaoHoje[];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/terapeuta"
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
              <h1 className="text-white font-semibold leading-tight">
                Sessões de hoje
              </h1>
              <p className="text-white/60 text-xs capitalize">
                {formatDateLong(today)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 mb-1">
              Nenhuma sessão agendada para hoje
            </p>
            <p className="text-sm text-gray-400">
              As sessões registradas para hoje aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {lista.map((s) => {
                const paciente = s.patients;
                return (
                  <li key={s.id}>
                    <Link
                      href={
                        paciente
                          ? `/terapeuta/pacientes/${paciente.id}/sessoes`
                          : "#"
                      }
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
                      >
                        {paciente?.full_name.charAt(0).toUpperCase() ?? "?"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {paciente?.full_name ?? "Paciente removido"}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {[
                            formatTime(s.start_time),
                            s.clinics?.name,
                            s.duration_minutes
                              ? `${s.duration_minutes} min`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${statusClassName(s.status)}`}
                      >
                        {statusLabel(s.status)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

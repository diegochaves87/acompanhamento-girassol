import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { statusBadge, statusClassName } from "@/lib/session-status";

type Props = {
  searchParams: { paciente?: string; status?: string };
};

type Sessao = {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  value_brl: number | null;
  patient_id: string;
  patients: { id: string; full_name: string } | null;
  clinics: { name: string } | null;
};

type Paciente = { id: string; full_name: string };

function formatDateTime(scheduledAt: string) {
  const d = new Date(scheduledAt);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hour = String(d.getUTCHours()).padStart(2, "0");
  const minute = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export default async function AgendaSessoesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const tenantId = userData?.tenant_id ?? "";

  const [pacientesRes, sessoesRes] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("full_name"),
    (() => {
      let q = supabase
        .from("sessions")
        .select(
          "id, scheduled_at, status, duration_minutes, value_brl, patient_id, patients(id, full_name), clinics(name)"
        )
        .eq("tenant_id", tenantId)
        .order("scheduled_at", { ascending: false })
        .limit(150);
      if (searchParams.paciente) q = q.eq("patient_id", searchParams.paciente);
      if (searchParams.status) q = q.eq("status", searchParams.status);
      return q;
    })(),
  ]);

  const lista = (sessoesRes.data ?? []) as unknown as Sessao[];
  const pacientes = (pacientesRes.data ?? []) as Paciente[];
  if (sessoesRes.error) console.error("[AgendaSessoes]", sessoesRes.error.message);

  const BACK_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link href="/terapeuta" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
              {BACK_ICON}
              Voltar ao menu principal
            </Link>
            <div className="flex gap-1 bg-white/10 rounded-xl p-1">
              <Link href="/terapeuta/agenda" className="px-3 py-1 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                Semana
              </Link>
              <Link href="/terapeuta/agenda/atendimentos" className="px-3 py-1 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                Atendimentos
              </Link>
              <Link href="/terapeuta/agenda/sessoes" className="px-3 py-1 rounded-lg text-sm font-semibold text-white bg-white/20">
                Sessões
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-semibold text-lg">Sessões</h1>
              <p className="text-white/60 text-xs mt-0.5">
                {lista.length} registro{lista.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link
              href="/terapeuta/agenda/sessoes/nova"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#ffffff", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nova sessão
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {/* Filtros */}
        <form method="GET" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Paciente</label>
            <select
              name="paciente"
              defaultValue={searchParams.paciente ?? ""}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-[#1a4a3a]"
            >
              <option value="">Todos os pacientes</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              name="status"
              defaultValue={searchParams.status ?? ""}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-[#1a4a3a]"
            >
              <option value="">Todos</option>
              <option value="scheduled">Agendada</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Concluída</option>
              <option value="canceled_therapist">Cancelada pelo Terapeuta</option>
              <option value="cancelled_family">Cancelada pela Família</option>
              <option value="unjustified_absence">Falta injustificada</option>
              <option value="justified_absence">Falta justificada</option>
              <option value="makeup">Reposição</option>
              <option value="holiday">Feriado</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1a4a3a" }}
            >
              Filtrar
            </button>
            <Link
              href="/terapeuta/agenda/sessoes"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Limpar
            </Link>
          </div>
        </form>

        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-600 mb-1">Nenhuma sessão encontrada</p>
            <p className="text-sm text-gray-400 mb-5">Ajuste os filtros ou cadastre uma nova sessão.</p>
            <Link
              href="/terapeuta/agenda/sessoes/nova"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1a4a3a" }}
            >
              Nova sessão
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Data / hora</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Paciente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Local</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Duração</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">
                        <Link
                          href={`/terapeuta/agenda/dia/${s.scheduled_at.slice(0, 10)}`}
                          className="hover:text-[#1a4a3a] transition-colors"
                        >
                          {formatDateTime(s.scheduled_at)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <Link
                          href={`/terapeuta/pacientes/${s.patient_id}/sessoes`}
                          className="hover:text-[#1a4a3a] transition-colors"
                        >
                          {s.patients?.full_name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {s.clinics?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {s.duration_minutes ? `${s.duration_minutes} min` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${statusClassName(s.status)}`}>
                          {statusBadge(s.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/terapeuta/pacientes/${s.patient_id}/sessoes/${s.id}`}
                          className="text-xs font-semibold text-[#1a4a3a] hover:underline"
                        >
                          Ver sessão
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {lista.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/terapeuta/pacientes/${s.patient_id}/sessoes/${s.id}`}
                    className="block px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {s.patients?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDateTime(s.scheduled_at)}
                        </p>
                        {s.clinics?.name && (
                          <p className="text-xs text-gray-400">{s.clinics.name}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${statusClassName(s.status)}`}>
                        {statusBadge(s.status)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

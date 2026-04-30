import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { statusBadge, statusClassName } from "@/lib/session-status";
import AtendimentosFiltros from "./AtendimentosFiltros";

type Props = {
  searchParams: {
    de?: string;
    ate?: string;
    paciente?: string;
    convenio?: string;
    evolucao?: string;
  };
};

type Atendimento = {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  value_brl: number | null;
  has_evolution: boolean | null;
  patient_id: string;
  patients: { id: string; full_name: string; insurance_name: string | null } | null;
  clinics: { name: string } | null;
};

function formatDateTime(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(v: number | null) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AtendimentosPage({ searchParams }: Props) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const tenantId = userData?.tenant_id ?? "";

  let query = supabase
    .from("sessions")
    .select(
      "id, scheduled_at, status, duration_minutes, value_brl, has_evolution, patient_id, patients(id, full_name, insurance_name), clinics(name)"
    )
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: false });

  if (searchParams.de) query = query.gte("scheduled_at", searchParams.de + "T00:00:00");
  if (searchParams.ate) query = query.lte("scheduled_at", searchParams.ate + "T23:59:59");
  if (searchParams.paciente) query = query.eq("patient_id", searchParams.paciente);
  if (searchParams.evolucao === "sim") query = query.eq("has_evolution", true);
  if (searchParams.evolucao === "nao")
    query = query.or("has_evolution.is.null,has_evolution.eq.false");

  const { data: sessoes, error } = await query;
  if (error) console.error("[Atendimentos]", error.message);

  let lista = (sessoes ?? []) as unknown as Atendimento[];

  if (searchParams.convenio) {
    lista = lista.filter((s) => s.patients?.insurance_name === searchParams.convenio);
  }

  const conveniosSet = new Set<string>();
  for (const s of lista) {
    if (s.patients?.insurance_name?.trim()) conveniosSet.add(s.patients.insurance_name.trim());
  }
  const conveniosUnicos = Array.from(conveniosSet).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const pacientesMap = new Map<string, { id: string; full_name: string }>();
  for (const s of lista) {
    if (s.patients && !pacientesMap.has(s.patient_id)) {
      pacientesMap.set(s.patient_id, { id: s.patient_id, full_name: s.patients.full_name });
    }
  }
  const pacientesUnicos = Array.from(pacientesMap.values()).sort((a, b) =>
    a.full_name.localeCompare(b.full_name, "pt-BR")
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link href="/terapeuta" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao menu principal
            </Link>
            <div className="flex gap-1 bg-white/10 rounded-xl p-1">
              <Link href="/terapeuta/agenda" className="px-3 py-1 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                Semana
              </Link>
              <Link href="/terapeuta/agenda/atendimentos" className="px-3 py-1 rounded-lg text-sm font-semibold text-white bg-white/20">
                Atendimentos
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-semibold text-lg">Atendimentos</h1>
              <p className="text-white/60 text-xs mt-0.5">{lista.length} registro{lista.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        <AtendimentosFiltros
          conveniosUnicos={conveniosUnicos}
          pacientesUnicos={pacientesUnicos}
        />

        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 text-center">
            <p className="font-semibold text-gray-600 mb-1">Nenhum atendimento encontrado</p>
            <p className="text-sm text-gray-400">Ajuste os filtros para ver resultados.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Data / hora</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Paciente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Local</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Duração</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Valor</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Evolução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">
                        <Link href={`/terapeuta/agenda/dia/${s.scheduled_at.slice(0, 10)}`} className="hover:text-[#1a4a3a] transition-colors">
                          {formatDateTime(s.scheduled_at)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <Link href={`/terapeuta/pacientes/${s.patient_id}`} className="hover:text-[#1a4a3a] transition-colors">
                          {s.patients?.full_name ?? "—"}
                        </Link>
                        {s.patients?.insurance_name && (
                          <p className="text-xs text-gray-400">{s.patients.insurance_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${statusClassName(s.status)}`}>
                          {statusBadge(s.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.clinics?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {s.duration_minutes ? `${s.duration_minutes} min` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">
                        {formatCurrency(s.value_brl)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.has_evolution ? (
                          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Sim</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {lista.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/terapeuta/agenda/dia/${s.scheduled_at.slice(0, 10)}`}
                    className="block px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{s.patients?.full_name ?? "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(s.scheduled_at)}</p>
                        <p className="text-xs text-gray-400">{[s.clinics?.name, s.duration_minutes ? `${s.duration_minutes} min` : null, formatCurrency(s.value_brl)].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusClassName(s.status)}`}>
                          {statusBadge(s.status)}
                        </span>
                        {s.has_evolution && (
                          <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">Evolução</span>
                        )}
                      </div>
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

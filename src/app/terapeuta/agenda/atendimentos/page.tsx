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
    status?: string;
    page?: string;
  };
};

type Atendimento = {
  id: string;
  scheduled_at: string;
  status: string;
  has_evolution: boolean | null;
  patient_id: string;
  patients: { id: string; full_name: string; insurance_name: string | null } | null;
  clinics: { name: string } | null;
};

function buildPageUrl(
  sp: { de?: string; ate?: string; paciente?: string; convenio?: string; evolucao?: string; status?: string },
  page: number
): string {
  const params = new URLSearchParams();
  if (sp.de) params.set("de", sp.de);
  if (sp.ate) params.set("ate", sp.ate);
  if (sp.paciente) params.set("paciente", sp.paciente);
  if (sp.convenio) params.set("convenio", sp.convenio);
  if (sp.evolucao) params.set("evolucao", sp.evolucao);
  if (sp.status) params.set("status", sp.status);
  params.set("page", String(page));
  return `/terapeuta/agenda/atendimentos?${params.toString()}`;
}

function formatDateTime(scheduledAt: string) {
  const d = new Date(scheduledAt);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hour = String(d.getUTCHours()).padStart(2, "0");
  const minute = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}`;
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

  const PAGE_SIZE = 50;
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("sessions")
    .select(
      "id, scheduled_at, status, has_evolution, patient_id, patients(id, full_name, insurance_name), clinics(name)",
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: true });

  if (searchParams.de) query = query.gte("scheduled_at", searchParams.de + "T00:00:00");
  if (searchParams.ate) query = query.lte("scheduled_at", searchParams.ate + "T23:59:59");
  if (searchParams.paciente) query = query.eq("patient_id", searchParams.paciente);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.evolucao === "sim") query = query.eq("has_evolution", true);
  else if (searchParams.evolucao === "nao") query = query.eq("has_evolution", false);
  query = query.range(from, to);

  const { data: sessoes, error, count } = await query;
  if (error) console.error("[Atendimentos]", error.message);

  let lista = (sessoes ?? []) as unknown as Atendimento[];

  const sessionIds = lista.map((s) => s.id);
  const { data: evoData } = sessionIds.length
    ? await supabase.from("evolutions").select("id, session_id").in("session_id", sessionIds).limit(10000)
    : { data: [] as { id: string; session_id: string }[] };
  const evoBySession = new Map((evoData ?? []).map((e) => [e.session_id, e.id]));
  const evolvedSessionIds = new Set(evoBySession.keys());

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
              <Link
                href="/terapeuta/agenda/sessoes"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#4CAF50" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Sessões
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-semibold text-lg">Atendimentos</h1>
              <p className="text-white/60 text-xs mt-0.5">{totalCount} registro{totalCount !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        <AtendimentosFiltros
          conveniosUnicos={conveniosUnicos}
          pacientesUnicos={pacientesUnicos}
          statusAtivo={searchParams.status ?? ""}
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Local</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Paciente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Evolução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map((s) => {
                    const isDone = s.status === "completed" || s.status === "makeup_completed";
                    const hasEvo = s.has_evolution === true || evolvedSessionIds.has(s.id);
                    const evoId = evoBySession.get(s.id);
                    const rowBg =
                      isDone
                        ? hasEvo
                          ? "#E8F5E9"
                          : "#FFF3E0"
                        : undefined;
                    return (
                      <tr key={s.id} className="transition-colors" style={rowBg ? { backgroundColor: rowBg } : undefined}>
                        <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">
                          <Link href={`/terapeuta/agenda/dia/${s.scheduled_at.slice(0, 10)}`} className="hover:text-[#1a4a3a] transition-colors">
                            {formatDateTime(s.scheduled_at)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{s.clinics?.name ?? "—"}</td>
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
                        <td className="px-4 py-3 text-center">
                          {isDone ? (
                            hasEvo ? (
                              <Link
                                href={evoId ? `/terapeuta/evolucoes/${evoId}` : `/terapeuta/evolucoes/nova?sessao=${s.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: "#1a4a3a" }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Evolução registrada
                              </Link>
                            ) : (
                              <Link
                                href={`/terapeuta/evolucoes/nova?sessao=${s.id}`}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors whitespace-nowrap"
                              >
                                Registrar evolução
                              </Link>
                            )
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {lista.map((s) => {
                const isDone = s.status === "completed" || s.status === "makeup_completed";
                const hasEvo = s.has_evolution === true || evolvedSessionIds.has(s.id);
                const evoId = evoBySession.get(s.id);
                const rowBg = isDone ? (hasEvo ? "#E8F5E9" : "#FFF3E0") : undefined;
                return (
                  <li key={s.id} style={rowBg ? { backgroundColor: rowBg } : undefined}>
                    <Link
                      href={`/terapeuta/agenda/dia/${s.scheduled_at.slice(0, 10)}`}
                      className="block px-5 py-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{s.patients?.full_name ?? "—"}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(s.scheduled_at)}</p>
                          {s.clinics?.name && <p className="text-xs text-gray-400">{s.clinics.name}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusClassName(s.status)}`}>
                            {statusBadge(s.status)}
                          </span>
                          {isDone && !hasEvo && (
                            <Link
                              href={`/terapeuta/evolucoes/nova?sessao=${s.id}`}
                              className="text-[10px] font-semibold text-white bg-green-600 px-1.5 py-0.5 rounded-full"
                            >
                              Evolução
                            </Link>
                          )}
                          {isDone && hasEvo && (
                            <Link
                              href={evoId ? `/terapeuta/evolucoes/${evoId}` : `/terapeuta/evolucoes/nova?sessao=${s.id}`}
                              className="text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: "#1a4a3a" }}
                            >
                              ✓ Registrada
                            </Link>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            {currentPage > 1 ? (
              <Link
                href={buildPageUrl(searchParams, currentPage - 1)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Anterior
              </Link>
            ) : (
              <span className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed">
                Anterior
              </span>
            )}
            <span className="text-xs text-gray-500 text-center whitespace-nowrap">
              Página {currentPage} de {totalPages} · {totalCount} registros
            </span>
            {currentPage < totalPages ? (
              <Link
                href={buildPageUrl(searchParams, currentPage + 1)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Próxima
              </Link>
            ) : (
              <span className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed">
                Próxima
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

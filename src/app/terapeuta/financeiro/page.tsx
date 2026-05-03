import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { statusLabel, statusClassName } from "@/lib/session-status";
import BarChartMensal, { MonthBar } from "./BarChartMensal";
import ExportarCSV, { CsvRow } from "./ExportarCSV";
import BotaoImprimir from "./BotaoImprimir";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  searchParams: {
    aba?: string;
    mes?: string;
    tipo?: string;
    clinica?: string;
    inicio?: string;
    fim?: string;
  };
};

type PatientInfo = {
  full_name: string;
  payment_type: string | null;
  value_per_session_brl: number | null;
  insurance_name: string | null;
};

type ClinicInfo = { id: string; name: string };

type SessionRow = {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  patient_id: string;
  clinic_id: string | null;
  patients: PatientInfo | null;
  clinics: ClinicInfo | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${ym}-01T00:00:00.000Z`,
    end: `${ym}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`,
  };
}

function getLast6Months(endYM: string): string[] {
  const [y, m] = endYM.split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    let mo = m - (5 - i);
    let yr = y;
    while (mo <= 0) { mo += 12; yr--; }
    return `${yr}-${String(mo).padStart(2, "0")}`;
  });
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const abbr = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${abbr[parseInt(m) - 1]}/${y.slice(2)}`;
}

function monthFullLabel(ym: string) {
  const [y, m] = ym.split("-");
  const full = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${full[parseInt(m) - 1]} ${y}`;
}

function sessionValue(s: SessionRow) {
  return s.patients?.value_per_session_brl ?? 0;
}

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

const REVENUE = ["completed", "makeup"];
const ABSENCE = ["unjustified_absence", "justified_absence"];

function calcMetrics(sessions: SessionRow[]) {
  const revenue = sessions.filter((s) => REVENUE.includes(s.status));
  const makeup  = sessions.filter((s) => s.status === "makeup");
  const absence = sessions.filter((s) => ABSENCE.includes(s.status));

  const receita    = revenue.reduce((sum, s) => sum + sessionValue(s), 0);
  const perdido    = absence.reduce((sum, s) => sum + sessionValue(s), 0);
  const recuperado = makeup.reduce((sum, s) => sum + sessionValue(s), 0);
  const totalAtend = revenue.length;
  const totalFalta = absence.length;
  const presenca   = totalAtend + totalFalta > 0
    ? Math.round((totalAtend / (totalAtend + totalFalta)) * 100)
    : 100;

  return { receita, perdido, recuperado, presenca, totalAtend, totalFalta };
}

function calcClinicRanking(sessions: SessionRow[]) {
  const map = new Map<string, { name: string; sessoes: number; receita: number; atend: number; faltas: number }>();
  for (const s of sessions) {
    const id   = s.clinic_id ?? "__sem__";
    const name = s.clinics?.name ?? "Sem clínica";
    if (!map.has(id)) map.set(id, { name, sessoes: 0, receita: 0, atend: 0, faltas: 0 });
    const e = map.get(id)!;
    if (REVENUE.includes(s.status)) { e.sessoes++; e.receita += sessionValue(s); e.atend++; }
    if (ABSENCE.includes(s.status)) { e.faltas++; }
  }
  return Array.from(map.values())
    .map((e) => ({ ...e, presenca: e.atend + e.faltas > 0 ? Math.round((e.atend / (e.atend + e.faltas)) * 100) : 100 }))
    .sort((a, b) => b.receita - a.receita);
}

function calcPatientRanking(sessions: SessionRow[]) {
  const map = new Map<string, { name: string; sessoes: number; faltas: number; receita: number; tipo: string; convenio: string | null }>();
  for (const s of sessions) {
    const id = s.patient_id;
    const p  = s.patients;
    if (!map.has(id)) map.set(id, {
      name: p?.full_name ?? "Paciente",
      sessoes: 0, faltas: 0, receita: 0,
      tipo: p?.payment_type ?? "particular",
      convenio: p?.insurance_name ?? null,
    });
    const e = map.get(id)!;
    if (REVENUE.includes(s.status)) { e.sessoes++; e.receita += sessionValue(s); }
    if (ABSENCE.includes(s.status)) { e.faltas++; }
  }
  return Array.from(map.values()).sort((a, b) => b.receita - a.receita);
}

function calcMonthly(sessions: SessionRow[], months: string[]): MonthBar[] {
  const totals = new Map(months.map((m) => [m, 0]));
  for (const s of sessions) {
    if (!REVENUE.includes(s.status)) continue;
    const ym = s.scheduled_at.slice(0, 7);
    if (totals.has(ym)) totals.set(ym, (totals.get(ym) ?? 0) + sessionValue(s));
  }
  return months.map((ym) => ({ label: monthLabel(ym), value: totals.get(ym) ?? 0 }));
}

function calcAlerts(sessions: SessionRow[]) {
  const patientFaltas = new Map<string, { name: string; count: number }>();
  for (const s of sessions) {
    if (s.status !== "unjustified_absence") continue;
    const id = s.patient_id;
    const name = s.patients?.full_name ?? "Paciente";
    if (!patientFaltas.has(id)) patientFaltas.set(id, { name, count: 0 });
    patientFaltas.get(id)!.count++;
  }
  return Array.from(patientFaltas.values())
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function FinanceiroPage({ searchParams }: Props) {
  const aba = searchParams.aba === "controle" ? "controle" : "dashboard";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/terapeuta");

  const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).maybeSingle();
  const tenantId = userData?.tenant_id ?? "";

  // ── CONTROLE tab ──────────────────────────────────────────────────────────
  if (aba === "controle") {
    const today = currentYearMonth();
    const { start: defStart, end: defEnd } = monthRange(today);

    const clinicaId  = searchParams.clinica ?? "";
    const inicioPar  = searchParams.inicio;
    const fimPar     = searchParams.fim;
    const inicioISO  = inicioPar ? `${inicioPar}T00:00:00.000Z` : defStart;
    const fimISO     = fimPar    ? `${fimPar}T23:59:59.999Z`    : defEnd;

    const [clinicasRes, sessionsRes] = await Promise.all([
      supabase.from("clinics").select("id, name").eq("tenant_id", tenantId).order("name"),
      (() => {
        let q = supabase
          .from("sessions")
          .select("id, scheduled_at, status, duration_minutes, patient_id, clinic_id, patients(full_name, payment_type, value_per_session_brl, insurance_name), clinics(id, name)")
          .eq("tenant_id", tenantId)
          .gte("scheduled_at", inicioISO)
          .lte("scheduled_at", fimISO)
          .order("scheduled_at", { ascending: false });
        if (clinicaId) q = q.eq("clinic_id", clinicaId);
        return q;
      })(),
    ]);

    const clinicas = clinicasRes.data ?? [];
    const sessions = (sessionsRes.data ?? []) as unknown as SessionRow[];

    const totalSessoes  = sessions.filter((s) => REVENUE.includes(s.status)).length;
    const totalValor    = sessions.filter((s) => REVENUE.includes(s.status)).reduce((sum, s) => sum + sessionValue(s), 0);

    const csvRows: CsvRow[] = sessions.map((s) => ({
      data:     formatSessionDate(s.scheduled_at),
      paciente: s.patients?.full_name ?? "—",
      status:   statusLabel(s.status),
      duracao:  s.duration_minutes ? `${s.duration_minutes} min` : "—",
      tipo:     s.patients?.payment_type === "convenio" ? (s.patients?.insurance_name ?? "Convênio") : "Particular",
      valor:    s.patients?.value_per_session_brl != null ? formatBRL(s.patients.value_per_session_brl) : "—",
    }));

    const csvHeaders = [
      { key: "data",     label: "Data/Hora" },
      { key: "paciente", label: "Paciente" },
      { key: "status",   label: "Status" },
      { key: "duracao",  label: "Duração" },
      { key: "tipo",     label: "Tipo/Convênio" },
      { key: "valor",    label: "Valor (R$)" },
    ];

    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
        <Header aba={aba} />

        <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
          {/* Filtros */}
          <form method="GET" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <input type="hidden" name="aba" value="controle" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Clínica</label>
                <select name="clinica" defaultValue={clinicaId}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-[#1a4a3a]">
                  <option value="">Todas as clínicas</option>
                  {clinicas.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Data início</label>
                <input type="date" name="inicio" defaultValue={inicioPar ?? defStart.slice(0, 10)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1a4a3a]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Data fim</label>
                <input type="date" name="fim" defaultValue={fimPar ?? defEnd.slice(0, 10)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1a4a3a]" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button type="submit"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1a4a3a" }}>
                Filtrar
              </button>
            </div>
          </form>

          {/* Resumo */}
          {sessions.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="Sessões realizadas" value={String(totalSessoes)} sub="no período" />
              <MetricCard label="Valor total" value={formatBRL(totalValor)} sub="sessões realizadas + reposições" />
            </div>
          )}

          {/* Tabela */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                {sessions.length} sessão{sessions.length !== 1 ? "ões" : ""} no período
              </h2>
              <div className="flex gap-2">
                <BotaoImprimir />
                <ExportarCSV filename="controle-pagamento" headers={csvHeaders} rows={csvRows} />
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-gray-400">Nenhuma sessão encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Data</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Paciente</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Duração</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Tipo</th>
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 text-gray-600 whitespace-nowrap">{formatSessionDate(s.scheduled_at)}</td>
                        <td className="py-2.5 px-4 font-medium text-gray-800">{s.patients?.full_name ?? "—"}</td>
                        <td className="py-2.5 px-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusClassName(s.status)}`}>
                            {statusLabel(s.status)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-500">
                          {s.duration_minutes ? `${s.duration_minutes} min` : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500">
                          {s.patients?.payment_type === "convenio"
                            ? (s.patients.insurance_name ?? "Convênio")
                            : "Particular"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-gray-800">
                          {s.patients?.value_per_session_brl != null
                            ? formatBRL(s.patients.value_per_session_brl)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-100 bg-gray-50">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-4 text-sm font-semibold text-gray-700">Total realizado</td>
                      <td className="py-2.5 px-4 text-right text-sm font-bold" style={{ color: "#1a4a3a" }}>
                        {formatBRL(totalValor)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // ── DASHBOARD tab ─────────────────────────────────────────────────────────

  const selectedYM  = searchParams.mes ?? currentYearMonth();
  const tipo        = searchParams.tipo ?? "todos";
  const chartMonths = getLast6Months(selectedYM);
  const { start: chartStart } = monthRange(chartMonths[0]);
  const { end: chartEnd }     = monthRange(selectedYM);
  const { start: mesStart, end: mesEnd } = monthRange(selectedYM);

  const { data: rawSessions } = await supabase
    .from("sessions")
    .select("id, scheduled_at, status, duration_minutes, patient_id, clinic_id, patients(full_name, payment_type, value_per_session_brl, insurance_name), clinics(id, name)")
    .eq("tenant_id", tenantId)
    .gte("scheduled_at", chartStart)
    .lte("scheduled_at", chartEnd)
    .order("scheduled_at", { ascending: false });

  const allSessions = (rawSessions ?? []) as unknown as SessionRow[];

  // Apply tipo filter
  const filtered = tipo === "todos"
    ? allSessions
    : allSessions.filter((s) => s.patients?.payment_type === tipo);

  // Month-specific data
  const mesSessions = filtered.filter((s) => s.scheduled_at >= mesStart && s.scheduled_at <= mesEnd);

  const metrics = calcMetrics(mesSessions);
  const clinicRanking = calcClinicRanking(mesSessions);
  const patientRanking = calcPatientRanking(mesSessions);
  const monthlyData = calcMonthly(filtered, chartMonths);
  const alerts = calcAlerts(mesSessions);

  const mesOptions = getLast6Months(currentYearMonth()).reverse();

  const dashCsvHeaders = [
    { key: "paciente", label: "Paciente" },
    { key: "sessoes",  label: "Sessões realizadas" },
    { key: "faltas",   label: "Faltas" },
    { key: "receita",  label: "Receita (R$)" },
    { key: "tipo",     label: "Tipo" },
  ];
  const dashCsvRows: CsvRow[] = patientRanking.map((p) => ({
    paciente: p.name,
    sessoes:  p.sessoes,
    faltas:   p.faltas,
    receita:  formatBRL(p.receita),
    tipo:     p.tipo === "convenio" ? (p.convenio ?? "Convênio") : "Particular",
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <Header aba={aba} />

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Filtros */}
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="aba" value="dashboard" />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Mês</label>
            <select name="mes" defaultValue={selectedYM}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-[#1a4a3a]">
              {mesOptions.map((ym) => (
                <option key={ym} value={ym}>{monthFullLabel(ym)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo</label>
            <select name="tipo" defaultValue={tipo}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-[#1a4a3a]">
              <option value="todos">Todos</option>
              <option value="particular">Particular</option>
              <option value="convenio">Convênio</option>
            </select>
          </div>
          <button type="submit"
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#1a4a3a" }}>
            Aplicar
          </button>
          <div className="ml-auto flex gap-2">
            <BotaoImprimir />
            <ExportarCSV filename={`financeiro-${selectedYM}`} headers={dashCsvHeaders} rows={dashCsvRows} />
          </div>
        </form>

        {/* Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Receita realizada"
            value={formatBRL(metrics.receita)}
            sub={`${metrics.totalAtend} sessão${metrics.totalAtend !== 1 ? "ões" : ""}`}
            highlight
          />
          <MetricCard
            label="Perdido por faltas"
            value={formatBRL(metrics.perdido)}
            sub={`${metrics.totalFalta} falta${metrics.totalFalta !== 1 ? "s" : ""}`}
            danger
          />
          <MetricCard
            label="Recuperado (repos.)"
            value={formatBRL(metrics.recuperado)}
            sub="reposições realizadas"
          />
          <MetricCard
            label="Presença média"
            value={`${metrics.presenca}%`}
            sub={`${metrics.totalAtend} de ${metrics.totalAtend + metrics.totalFalta}`}
          />
        </div>

        {/* Gráfico últimos 6 meses */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Receita — últimos 6 meses</h2>
          <BarChartMensal data={monthlyData} />
        </section>

        {/* Rankings lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Ranking clínicas */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Clínicas</h2>
            {clinicRanking.length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados no período.</p>
            ) : (
              <div className="space-y-2">
                {clinicRanking.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.sessoes} sessões · {c.presenca}% presença</p>
                    </div>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: "#1a4a3a" }}>
                      {formatBRL(c.receita)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ranking pacientes */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pacientes</h2>
            {patientRanking.length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados no período.</p>
            ) : (
              <div className="space-y-2">
                {patientRanking.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                          {p.tipo === "convenio" ? (p.convenio ?? "Conv.") : "Part."}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {p.sessoes} realizada{p.sessoes !== 1 ? "s" : ""}
                        {p.faltas > 0 ? ` · ${p.faltas} falta${p.faltas !== 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: "#1a4a3a" }}>
                      {formatBRL(p.receita)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <section className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-sm font-semibold text-amber-700">Faltas injustificadas no período</h2>
            </div>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{a.name}</span>
                  <span className="font-semibold text-amber-600">
                    {a.count} falta{a.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header({ aba }: { aba: string }) {
  return (
    <div style={{ backgroundColor: "#1a4a3a" }}>
      <div className="max-w-5xl mx-auto px-6 pt-4 pb-0">
        <Link
          href="/terapeuta"
          className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Início
        </Link>
        <h1 className="text-white font-bold text-xl mb-4">Financeiro</h1>
        <div
          className="flex overflow-x-auto border-b border-white/10 -mx-6 px-6"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {(["dashboard", "controle"] as const).map((a) => (
            <Link
              key={a}
              href={`/terapeuta/financeiro?aba=${a}`}
              className={`flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                aba === a
                  ? "text-white border-white"
                  : "text-white/45 border-transparent hover:text-white/75"
              }`}
            >
              {a === "dashboard" ? "Dashboard" : "Controle de Pagamento"}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, sub, highlight, danger,
}: {
  label: string; value: string; sub?: string; highlight?: boolean; danger?: boolean;
}) {
  const color = highlight ? "#1a4a3a" : danger ? "#dc2626" : "#374151";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold leading-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

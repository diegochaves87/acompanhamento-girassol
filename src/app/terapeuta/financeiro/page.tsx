import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { statusLabel, statusClassName } from "@/lib/session-status";
import BarChartMensal, { MonthBar } from "./BarChartMensal";
import ExportarCSV, { CsvRow } from "./ExportarCSV";
import BotaoImprimir from "./BotaoImprimir";
import BotaoExportarPDF from "./BotaoExportarPDF";

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
  diagnosis: string | null;
};

type ClinicInfo = { id: string; name: string };

type SessionRow = {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  patient_id: string;
  clinic_id: string | null;
  reposition_session_id: string | null;
  original_status: string | null;
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

function formatDateOnly(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${d.getUTCFullYear()}`;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

const REVENUE       = ["completed", "makeup", "makeup_completed"];
const FALTAS        = ["unjustified_absence", "justified_absence"];
const CANCELAMENTOS = ["canceled_therapist", "cancelled_family"];
const REPOSTA_S     = ["reposta"];

function calcMetrics(sessions: SessionRow[]) {
  const revenue       = sessions.filter((s) => REVENUE.includes(s.status));
  const makeup        = sessions.filter((s) => s.status === "makeup" || s.status === "makeup_completed");
  const faltas        = sessions.filter((s) => FALTAS.includes(s.status));
  const cancelamentos = sessions.filter((s) => CANCELAMENTOS.includes(s.status));

  const receita              = revenue.reduce((sum, s) => sum + sessionValue(s), 0);
  const perdidoFaltas        = faltas.reduce((sum, s) => sum + sessionValue(s), 0);
  const perdidoCancelamentos = cancelamentos.reduce((sum, s) => sum + sessionValue(s), 0);
  const recuperado           = makeup.reduce((sum, s) => sum + sessionValue(s), 0);
  const totalAtend           = revenue.length;
  const totalFalta           = faltas.length;
  const totalCancelamentos   = cancelamentos.length;
  const totalReposicoes      = makeup.length;
  const presenca             = totalAtend + totalFalta > 0
    ? Math.round((totalAtend / (totalAtend + totalFalta)) * 100)
    : 100;

  return { receita, perdidoFaltas, perdidoCancelamentos, recuperado, presenca, totalAtend, totalFalta, totalCancelamentos, totalReposicoes };
}

function calcClinicRanking(sessions: SessionRow[]) {
  const map = new Map<string, { name: string; sessoes: number; receita: number; atend: number; faltas: number; cancelamentos: number; reposicoes: number }>();
  for (const s of sessions) {
    const id   = s.clinic_id ?? "__sem__";
    const name = s.clinics?.name ?? "Sem clínica";
    if (!map.has(id)) map.set(id, { name, sessoes: 0, receita: 0, atend: 0, faltas: 0, cancelamentos: 0, reposicoes: 0 });
    const e = map.get(id)!;
    if (REVENUE.includes(s.status)) { e.sessoes++; e.receita += sessionValue(s); e.atend++; }
    if (FALTAS.includes(s.status)) { e.faltas++; }
    if (CANCELAMENTOS.includes(s.status)) { e.cancelamentos++; }
    if (s.status === "makeup") { e.reposicoes++; }
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
    if (FALTAS.includes(s.status) || CANCELAMENTOS.includes(s.status)) { e.faltas++; }
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

function calcTopAssiduous(sessions: SessionRow[]) {
  const map = new Map<string, { name: string; sessoes: number; faltas: number }>();
  for (const s of sessions) {
    const id = s.patient_id;
    if (!map.has(id)) map.set(id, { name: s.patients?.full_name ?? "Paciente", sessoes: 0, faltas: 0 });
    const e = map.get(id)!;
    if (REVENUE.includes(s.status)) e.sessoes++;
    if (FALTAS.includes(s.status)) e.faltas++;
  }
  return Array.from(map.values())
    .filter((e) => e.sessoes + e.faltas >= 2)
    .map((e) => ({ ...e, presenca: e.sessoes + e.faltas > 0 ? Math.round((e.sessoes / (e.sessoes + e.faltas)) * 100) : 100 }))
    .sort((a, b) => b.presenca - a.presenca || b.sessoes - a.sessoes)
    .slice(0, 5);
}

function calcTopAbsent(sessions: SessionRow[]) {
  const map = new Map<string, { name: string; faltas: number }>();
  for (const s of sessions) {
    if (!FALTAS.includes(s.status)) continue;
    const id = s.patient_id;
    if (!map.has(id)) map.set(id, { name: s.patients?.full_name ?? "Paciente", faltas: 0 });
    map.get(id)!.faltas++;
  }
  return Array.from(map.values())
    .sort((a, b) => b.faltas - a.faltas)
    .slice(0, 5);
}

function calcClinicPatientRanking(sessions: SessionRow[]) {
  const clinicMap = new Map<string, { name: string; patients: Map<string, { name: string; receita: number; sessoes: number }> }>();
  for (const s of sessions) {
    if (!REVENUE.includes(s.status)) continue;
    const cid   = s.clinic_id ?? "__sem__";
    const cname = s.clinics?.name ?? "Sem clínica";
    const pid   = s.patient_id;
    const pname = s.patients?.full_name ?? "Paciente";
    if (!clinicMap.has(cid)) clinicMap.set(cid, { name: cname, patients: new Map() });
    const clinic = clinicMap.get(cid)!;
    if (!clinic.patients.has(pid)) clinic.patients.set(pid, { name: pname, receita: 0, sessoes: 0 });
    const pat = clinic.patients.get(pid)!;
    pat.receita += sessionValue(s);
    pat.sessoes++;
  }
  return Array.from(clinicMap.values())
    .map((c) => ({
      clinicName: c.name,
      patients: Array.from(c.patients.values()).sort((a, b) => b.receita - a.receita).slice(0, 5),
    }))
    .sort((a, b) => {
      const ra = a.patients.reduce((s, p) => s + p.receita, 0);
      const rb = b.patients.reduce((s, p) => s + p.receita, 0);
      return rb - ra;
    });
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

function presencaStatus(pct: number): { label: string; color: string } {
  if (pct >= 95) return { label: "Excelente", color: "#4CAF50" };
  if (pct >= 85) return { label: "Ótima",     color: "#2E7BC1" };
  if (pct >= 75) return { label: "Boa",        color: "#F59E0B" };
  return                { label: "Atenção",    color: "#EF4444" };
}

type ClinicStats = {
  name: string; pacientes: number; realizadas: number; reposicoes: number;
  faltasInj: number; faltasJust: number; faltas: number; cancelamentos: number;
  presenca: number; receita: number; perdido: number;
};

function calcClinicStats(sessions: SessionRow[]): ClinicStats[] {
  const map = new Map<string, {
    name: string; pacientes: Set<string>;
    realizadas: number; reposicoes: number; faltasInj: number; faltasJust: number; cancelamentos: number;
    receita: number; perdido: number;
  }>();
  for (const s of sessions) {
    const id   = s.clinic_id ?? "__sem__";
    const name = s.clinics?.name ?? "Sem clínica";
    if (!map.has(id)) map.set(id, { name, pacientes: new Set(), realizadas: 0, reposicoes: 0, faltasInj: 0, faltasJust: 0, cancelamentos: 0, receita: 0, perdido: 0 });
    const e = map.get(id)!;
    e.pacientes.add(s.patient_id);
    if (s.status === "completed")                                             { e.realizadas++;    e.receita += sessionValue(s); }
    if (s.status === "makeup_completed")                                      { e.reposicoes++;    e.receita += sessionValue(s); }
    if (s.status === "unjustified_absence")                                   { e.faltasInj++;     e.perdido += sessionValue(s); }
    if (s.status === "justified_absence")                                     { e.faltasJust++;    e.perdido += sessionValue(s); }
    if (s.status === "canceled_therapist" || s.status === "cancelled_family") { e.cancelamentos++; e.perdido += sessionValue(s); }
  }
  return Array.from(map.values()).map((e) => {
    const total    = e.realizadas + e.reposicoes + e.faltasInj + e.faltasJust;
    const presenca = total > 0 ? Math.round(((e.realizadas + e.reposicoes) / total) * 100) : 100;
    return { name: e.name, pacientes: e.pacientes.size, realizadas: e.realizadas, reposicoes: e.reposicoes, faltasInj: e.faltasInj, faltasJust: e.faltasJust, faltas: e.faltasInj + e.faltasJust, cancelamentos: e.cancelamentos, presenca, receita: e.receita, perdido: e.perdido };
  }).sort((a, b) => b.receita - a.receita);
}

type PatientStats = {
  name: string; clinicName: string; diagnosis: string | null; tipo: string;
  realizadas: number; reposicoes: number; faltas: number; cancelamentos: number;
  presenca: number; receita: number; perdido: number;
};

function calcPatientStats(sessions: SessionRow[]): PatientStats[] {
  const map = sessions.reduce<Map<string, {
    name: string; clinicName: string; diagnosis: string | null; tipo: string;
    realizadas: number; reposicoes: number; faltas: number; cancelamentos: number;
    receita: number; perdido: number;
  }>>((acc, s) => {
    const isCompleted       = s.status === "completed";
    const isMakeupCompleted = s.status === "makeup_completed";
    const isFalta           = s.status === "justified_absence" || s.status === "unjustified_absence";
    const isCancelamento    = s.status === "canceled_therapist" || s.status === "cancelled_family";

    const id = s.patient_id;
    const p  = s.patients;
    if (!acc.has(id)) acc.set(id, {
      name: p?.full_name ?? "Paciente",
      clinicName: s.clinics?.name ?? "—",
      diagnosis: p?.diagnosis ?? null,
      tipo: p?.payment_type ?? "particular",
      realizadas: 0, reposicoes: 0, faltas: 0, cancelamentos: 0, receita: 0, perdido: 0,
    });
    const e = acc.get(id)!;
    if (isCompleted)       { e.realizadas++;    e.receita += sessionValue(s); }
    if (isMakeupCompleted) { e.reposicoes++;    e.receita += sessionValue(s); }
    if (isFalta)           { e.faltas++;        e.perdido += sessionValue(s); }
    if (isCancelamento)    { e.cancelamentos++; e.perdido += sessionValue(s); }
    return acc;
  }, new Map());

  return Array.from(map.values()).map((e) => {
    const total    = e.realizadas + e.reposicoes + e.faltas;
    const presenca = total > 0 ? Math.round(((e.realizadas + e.reposicoes) / total) * 100) : 100;
    return { ...e, presenca };
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function FinanceiroPage({ searchParams }: Props) {
  const aba = searchParams.aba === "controle" ? "controle" : "dashboard";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/terapeuta");

  const { data: userData } = await supabase.from("users").select("tenant_id, full_name").eq("id", user.id).maybeSingle();
  const tenantId = userData?.tenant_id ?? "";
  const terapeutaNome = (userData as { full_name?: string } | null)?.full_name ?? "Terapeuta";

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
      <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
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
    .select("id, scheduled_at, status, duration_minutes, patient_id, clinic_id, reposition_session_id, original_status, patients(full_name, payment_type, value_per_session_brl, insurance_name, diagnosis), clinics(id, name)")
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
  const ticketMedio = metrics.totalAtend > 0 ? metrics.receita / metrics.totalAtend : 0;
  const receitaProjetada = mesSessions
    .filter((s) => s.status === "scheduled")
    .reduce((sum, s) => sum + sessionValue(s), 0);
  const clinicRanking = calcClinicRanking(mesSessions);
  const patientRanking = calcPatientRanking(mesSessions);
  const clinicPatients = calcClinicPatientRanking(mesSessions);
  const topAssiduous = calcTopAssiduous(mesSessions);
  const topAbsent = calcTopAbsent(mesSessions);
  const monthlyData = calcMonthly(filtered, chartMonths);
  const alerts = calcAlerts(mesSessions);

  // ── New rankings ──────────────────────────────────────────────────────────
  const clinicStats = calcClinicStats(mesSessions);
  const allPatientStats = calcPatientStats(mesSessions);
  const patientStatsByReceita = [...allPatientStats].sort((a, b) => b.receita - a.receita).slice(0, 20);
  const patientStatsByAssid   = [...allPatientStats].sort((a, b) => b.presenca - a.presenca || b.realizadas - a.realizadas);

  // Batch-fetch original sessions for the reposição table
  const makeupLinked = mesSessions.filter((s) => s.status === "makeup_completed" && s.reposition_session_id);
  const origIds = makeupLinked.map((s) => s.reposition_session_id!);
  type OrigRow = { id: string; scheduled_at: string; status: string; original_status: string | null };
  const origSessMap: Record<string, OrigRow> = {};
  if (origIds.length > 0) {
    const { data: origData } = await supabase.from("sessions").select("id, scheduled_at, status, original_status").in("id", origIds);
    if (origData) for (const o of origData as OrigRow[]) origSessMap[o.id] = o;
  }
  const reposicoesTable = makeupLinked
    .map((s) => ({ session: s, original: origSessMap[s.reposition_session_id!] ?? null }))
    .sort((a, b) => a.session.scheduled_at.localeCompare(b.session.scheduled_at));

  // ── Dados pré-computados para o PDF ──────────────────────────────────────
  const perdidasList = mesSessions.filter((s) =>
    [...FALTAS, ...CANCELAMENTOS, ...REPOSTA_S].includes(s.status)
  );
  const valorPerdidas         = perdidasList.reduce((sum, s) => sum + sessionValue(s), 0);
  const makeupAgendadasList   = mesSessions.filter((s) => s.status === "makeup");
  const valorMakeupAgendadas  = makeupAgendadasList.reduce((sum, s) => sum + sessionValue(s), 0);
  const repRealizadasList     = mesSessions.filter((s) => s.status === "makeup_completed");
  const valorRepRealizadas    = repRealizadasList.reduce((sum, s) => sum + sessionValue(s), 0);
  const saldoQtd              = repRealizadasList.length - perdidasList.length;
  const saldoValor            = valorRepRealizadas - valorPerdidas;

  const pdfReposicoes = reposicoesTable.map(({ session: s, original: orig }) => ({
    paciente:       s.patients?.full_name ?? "—",
    dataFalta:      orig ? formatDateOnly(orig.scheduled_at) : "—",
    dataReposicao:  formatDateOnly(s.scheduled_at),
    statusOriginal: statusLabel(orig?.original_status || orig?.status || "—"),
    valor:          sessionValue(s),
  }));

  const pdfData = {
    profissional:         { nome: terapeutaNome },
    periodo:              monthFullLabel(selectedYM),
    periodoSlug:          selectedYM,
    metrics,
    reposicaoCards: {
      perdidas:           perdidasList.length,        valorPerdidas,
      makeupAgendadas:    makeupAgendadasList.length,  valorMakeupAgendadas,
      repRealizadas:      repRealizadasList.length,    valorRepRealizadas,
      saldoQtd,           saldoValor,
    },
    clinicStats,
    patientStatsByReceita,
    patientStatsByAssid,
    reposicoes: pdfReposicoes,
  };

  const mesOptions = getLast6Months(currentYearMonth()).reverse();
  const maxPatientReceita = patientRanking[0]?.receita || 1;

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

  const todayLong = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
    <style>{`
      @media print {
        .no-print { display: none !important; }
        .print-only { display: block !important; }
        .print-footer { display: block !important; position: fixed; bottom: 0; left: 0; right: 0; }
        @page { margin: 2cm; }
        body { background: white !important; }
      }
      .print-only { display: none; }
      .print-footer { display: none; }
    `}</style>
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>

      {/* Print header — visible only when printing */}
      <div className="print-only px-8 pt-6 pb-4 border-b-2" style={{ borderColor: "#FFBA3D" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/identidade-visual/Logo-Nome-Slogan.png" alt="Girassol" style={{ height: 56, width: "auto", objectFit: "contain" }} />
            <div>
              <p className="font-bold text-lg" style={{ color: "#1D3557" }}>{terapeutaNome}</p>
              <p className="text-sm font-semibold" style={{ color: "#4CAF50" }}>Relatório Financeiro — {monthFullLabel(selectedYM)}</p>
            </div>
          </div>
          <div className="text-right text-xs" style={{ color: "#9CA3AF" }}>
            <p>Gerado em {todayLong}</p>
            <p style={{ color: "#4CAF50", fontWeight: 600 }}>Acompanhamento Girassol</p>
          </div>
        </div>
      </div>

      <div className="no-print"><Header aba={aba} /></div>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Filtros */}
        <form method="GET" className="no-print flex flex-wrap items-end gap-3">
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
            <BotaoExportarPDF data={pdfData} />
            <ExportarCSV filename={`financeiro-${selectedYM}`} headers={dashCsvHeaders} rows={dashCsvRows} />
          </div>
        </form>

        {/* Cards KPI — linha 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Receita realizada"
            value={formatBRL(metrics.receita)}
            sub={`${metrics.totalAtend} ${metrics.totalAtend !== 1 ? "sessões" : "sessão"}`}
            highlight
            tooltip="Soma das sessões concluídas (completed) e reposições (makeup) no período."
          />
          <MetricCard
            label="Ticket médio"
            value={formatBRL(ticketMedio)}
            sub="por sessão realizada"
            color="#2E7BC1"
            tooltip="Receita realizada ÷ número de sessões concluídas + reposições."
          />
          <MetricCard
            label="Presença média"
            value={`${metrics.presenca}%`}
            sub={`${metrics.totalAtend} de ${metrics.totalAtend + metrics.totalFalta}`}
            color="#4CAF50"
            tooltip="Sessões realizadas ÷ (realizadas + faltas). Cancelamentos não entram neste cálculo."
          />
          <MetricCard
            label="Receita projetada"
            value={formatBRL(receitaProjetada)}
            sub="sessões agendadas"
            color="#8E6CCF"
            tooltip="Valor estimado das sessões com status 'agendado' ou 'confirmado' no mês."
          />
        </div>

        {/* Cards KPI — linha 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Perdido por faltas"
            value={formatBRL(metrics.perdidoFaltas)}
            sub={`${metrics.totalFalta} falta${metrics.totalFalta !== 1 ? "s" : ""}`}
            danger
            tooltip="Valor perdido com faltas: missed, falta justificada e injustificada."
          />
          <MetricCard
            label="Perdido por cancelamentos"
            value={formatBRL(metrics.perdidoCancelamentos)}
            sub={`${metrics.totalCancelamentos} cancelamento${metrics.totalCancelamentos !== 1 ? "s" : ""}`}
            danger
            tooltip="Valor perdido com cancelamentos: pelo paciente, terapeuta ou familiar."
          />

          <MetricCard
            label="Sessões realizadas"
            value={String(metrics.totalAtend)}
            sub="completed + reposições"
            tooltip="Total de atendimentos concluídos: sessões completas mais reposições."
          />
        </div>

        {/* Cards reposições */}
        {(perdidasList.length + makeupAgendadasList.length + repRealizadasList.length > 0) && (
          <section>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Faltas &amp; Reposições</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Sessões perdidas</p>
                <p className="text-2xl font-bold text-red-600">{perdidasList.length}</p>
                <p className="text-sm font-semibold text-red-500 mt-0.5">{formatBRL(valorPerdidas)}</p>
                <p className="text-xs text-gray-400 mt-1">faltas, cancelamentos e repostas</p>
              </div>
              <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: "#DDD6FE" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#8E6CCF" }}>Reposições agendadas</p>
                <p className="text-2xl font-bold" style={{ color: "#8E6CCF" }}>{makeupAgendadasList.length}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "#8E6CCF" }}>{formatBRL(valorMakeupAgendadas)}</p>
                <p className="text-xs text-gray-400 mt-1">aguardando realização</p>
              </div>
              <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Reposições realizadas</p>
                <p className="text-2xl font-bold" style={{ color: "#2E7D32" }}>{repRealizadasList.length}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "#2E7D32" }}>{formatBRL(valorRepRealizadas)}</p>
                <p className="text-xs text-gray-400 mt-1">sessões de reposição concluídas</p>
              </div>
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Saldo</p>
                <p className={`text-2xl font-bold ${saldoQtd >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {saldoQtd >= 0 ? "+" : ""}{saldoQtd}
                </p>
                <p className={`text-sm font-semibold mt-0.5 ${saldoValor >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {saldoValor >= 0 ? "+" : ""}{formatBRL(Math.abs(saldoValor))}
                </p>
                <p className="text-xs text-gray-400 mt-1">reposições realizadas vs. perdas</p>
              </div>
            </div>
          </section>
        )}

        {/* Gráfico últimos 6 meses */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Receita — últimos 6 meses</h2>
          <BarChartMensal data={monthlyData} />
        </section>

        {/* ── SEÇÃO 2: Clínicas — Rentabilidade ── */}
        {clinicStats.length > 0 && (
          <details open className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none list-none">
              <div className="flex-1">
                <h2 className="text-sm font-semibold" style={{ color: "#1D3557" }}>Clínicas — Rentabilidade</h2>
                <div className="mt-1 h-0.5 rounded-full" style={{ backgroundColor: "#FFBA3D" }} />
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ backgroundColor: "#1D3557" }}>
                    {["#", "Clínica", "Pacientes", "Realizadas", "Reposições", "Faltas/Cancel", "Presença", "Receita", "Perdido"].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-white uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clinicStats.map((c, i) => {
                    const st = presencaStatus(c.presenca);
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#F8FAFC" }}>
                        <td className="py-2.5 px-3 text-xs text-gray-400 border-b border-[#E2E8F0]">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 border-b border-[#E2E8F0]">{c.name}</td>
                        <td className="py-2.5 px-3 text-center text-gray-600 border-b border-[#E2E8F0]">{c.pacientes}</td>
                        <td className="py-2.5 px-3 text-center text-gray-600 border-b border-[#E2E8F0]">{c.realizadas}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]" style={{ color: "#8E6CCF" }}>{c.reposicoes}</td>
                        <td className="py-2.5 px-3 text-center text-red-500 border-b border-[#E2E8F0]">{c.faltas + c.cancelamentos}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${st.color}18`, color: st.color }}>{c.presenca}%</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold border-b border-[#E2E8F0]" style={{ color: "#1a4a3a" }}>{formatBRL(c.receita)}</td>
                        <td className="py-2.5 px-3 text-right text-red-500 border-b border-[#E2E8F0]">{formatBRL(c.perdido)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* ── SEÇÃO 3: Clínicas — Assiduidade ── */}
        {clinicStats.length > 0 && (
          <details open className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none list-none">
              <div className="flex-1">
                <h2 className="text-sm font-semibold" style={{ color: "#1D3557" }}>Clínicas — Assiduidade</h2>
                <div className="mt-1 h-0.5 rounded-full" style={{ backgroundColor: "#FFBA3D" }} />
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr style={{ backgroundColor: "#1D3557" }}>
                    {["#", "Clínica", "Realizadas", "Reposições", "Faltas inj.", "Faltas just.", "Presença", "Status"].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-white uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...clinicStats].sort((a, b) => b.presenca - a.presenca).map((c, i) => {
                    const st = presencaStatus(c.presenca);
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#F8FAFC" }}>
                        <td className="py-2.5 px-3 text-xs text-gray-400 border-b border-[#E2E8F0]">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 border-b border-[#E2E8F0]">{c.name}</td>
                        <td className="py-2.5 px-3 text-center text-gray-600 border-b border-[#E2E8F0]">{c.realizadas}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]" style={{ color: "#8E6CCF" }}>{c.reposicoes}</td>
                        <td className="py-2.5 px-3 text-center text-red-600 border-b border-[#E2E8F0]">{c.faltasInj}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]" style={{ color: "#FF5C7A" }}>{c.faltasJust}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]">
                          <span className="text-xs font-semibold" style={{ color: st.color }}>{c.presenca}%</span>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#E2E8F0]">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${st.color}18`, color: st.color }}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* ── SEÇÃO 4: Pacientes — Receita gerada ── */}
        {patientStatsByReceita.length > 0 && (
          <details open className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none list-none">
              <div className="flex-1">
                <h2 className="text-sm font-semibold" style={{ color: "#1D3557" }}>Pacientes — Receita gerada (top 20)</h2>
                <div className="mt-1 h-0.5 rounded-full" style={{ backgroundColor: "#FFBA3D" }} />
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr style={{ backgroundColor: "#1D3557" }}>
                    {["#", "Paciente", "Clínica", "Tipo pgto", "Realizadas", "Reposições", "Faltas/Cancel", "Presença", "Receita", "Perdido"].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-white uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patientStatsByReceita.map((p, i) => {
                    const st = presencaStatus(p.presenca);
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#F8FAFC" }}>
                        <td className="py-2.5 px-3 text-xs text-gray-400 border-b border-[#E2E8F0]">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 border-b border-[#E2E8F0]">{p.name}</td>
                        <td className="py-2.5 px-3 text-gray-500 border-b border-[#E2E8F0]">{p.clinicName}</td>
                        <td className="py-2.5 px-3 border-b border-[#E2E8F0]">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {p.tipo === "convenio" ? "Conv." : "Part."}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-600 border-b border-[#E2E8F0]">{p.realizadas}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]" style={{ color: "#8E6CCF" }}>{p.reposicoes}</td>
                        <td className="py-2.5 px-3 text-center text-red-500 border-b border-[#E2E8F0]">{p.faltas + p.cancelamentos}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]">
                          <span className="text-xs font-semibold" style={{ color: st.color }}>{p.presenca}%</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold border-b border-[#E2E8F0]" style={{ color: "#1a4a3a" }}>{formatBRL(p.receita)}</td>
                        <td className="py-2.5 px-3 text-right text-red-500 border-b border-[#E2E8F0]">{formatBRL(p.perdido)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* ── SEÇÃO 5: Pacientes — Assiduidade ── */}
        {patientStatsByAssid.length > 0 && (
          <details open className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none list-none">
              <div className="flex-1">
                <h2 className="text-sm font-semibold" style={{ color: "#1D3557" }}>Pacientes — Assiduidade</h2>
                <div className="mt-1 h-0.5 rounded-full" style={{ backgroundColor: "#FFBA3D" }} />
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr style={{ backgroundColor: "#1D3557" }}>
                    {["#", "Paciente", "Clínica", "Diagnóstico", "Realizadas", "Reposições", "Faltas", "Presença", "Status"].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-white uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patientStatsByAssid.map((p, i) => {
                    const neverAbsent = p.presenca === 100 && p.realizadas + p.reposicoes > 0 && p.faltas === 0;
                    const st = neverAbsent ? { label: "⭐ Nunca faltou", color: "#2E7D32" } : presencaStatus(p.presenca);
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#F8FAFC" }}>
                        <td className="py-2.5 px-3 text-xs text-gray-400 border-b border-[#E2E8F0]">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 border-b border-[#E2E8F0]">{p.name}</td>
                        <td className="py-2.5 px-3 text-gray-500 border-b border-[#E2E8F0]">{p.clinicName}</td>
                        <td className="py-2.5 px-3 text-xs text-gray-400 border-b border-[#E2E8F0]">{p.diagnosis ?? "—"}</td>
                        <td className="py-2.5 px-3 text-center text-gray-600 border-b border-[#E2E8F0]">{p.realizadas}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]" style={{ color: "#8E6CCF" }}>{p.reposicoes}</td>
                        <td className="py-2.5 px-3 text-center text-red-500 border-b border-[#E2E8F0]">{p.faltas}</td>
                        <td className="py-2.5 px-3 text-center border-b border-[#E2E8F0]">
                          <span className="text-xs font-semibold" style={{ color: st.color }}>{p.presenca}%</span>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#E2E8F0]">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${st.color}18`, color: st.color }}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* ── SEÇÃO 6: Reposições do período ── */}
        {reposicoesTable.length > 0 && (
          <details open className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none list-none">
              <div className="flex-1">
                <h2 className="text-sm font-semibold" style={{ color: "#1D3557" }}>Reposições do período</h2>
                <div className="mt-1 h-0.5 rounded-full" style={{ backgroundColor: "#FFBA3D" }} />
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr style={{ backgroundColor: "#1D3557" }}>
                    {["Paciente", "Data da falta", "Data da reposição", "Status original", "Valor recuperado"].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-white uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reposicoesTable.map(({ session: s, original: orig }, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#F8FAFC" }}>
                      <td className="py-2.5 px-3 font-medium text-gray-800 border-b border-[#E2E8F0]">{s.patients?.full_name ?? "—"}</td>
                      <td className="py-2.5 px-3 text-gray-500 border-b border-[#E2E8F0]">{orig ? formatDateOnly(orig.scheduled_at) : "—"}</td>
                      <td className="py-2.5 px-3 text-gray-600 border-b border-[#E2E8F0]">{formatDateOnly(s.scheduled_at)}</td>
                      <td className="py-2.5 px-3 border-b border-[#E2E8F0]">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {statusLabel(orig?.original_status || orig?.status || "—")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold border-b border-[#E2E8F0]" style={{ color: "#2E7D32" }}>{formatBRL(sessionValue(s))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* Top 5 Pacientes — ranking geral com barras de progresso */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#1D3557" }}>Top 5 Pacientes</h2>
          {patientRanking.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados no período.</p>
          ) : (
            <div className="space-y-4">
              {patientRanking.slice(0, 5).map((p, i) => {
                const pct = Math.round((p.receita / maxPatientReceita) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: "#1D3557" }}
                        >{i + 1}</span>
                        <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                          {p.tipo === "convenio" ? (p.convenio ?? "Conv.") : "Part."}
                        </span>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: "#4CAF50" }}>
                        {formatBRL(p.receita)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#4CAF50" }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {p.sessoes !== 1 ? `${p.sessoes} sessões` : "1 sessão"}
                      {p.faltas > 0 ? ` · ${p.faltas} falta${p.faltas !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top 5 por Clínica — accordion nativo */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#1D3557" }}>Top 5 por Clínica</h2>
          {clinicPatients.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados no período.</p>
          ) : (
            <div className="space-y-2">
              {clinicPatients.map((cp, i) => {
                const maxClinicRec = cp.patients[0]?.receita || 1;
                return (
                  <details key={i} className="rounded-xl border border-gray-100 overflow-hidden group">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors list-none select-none">
                      <span className="text-sm font-semibold" style={{ color: "#1D3557" }}>{cp.clinicName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{cp.patients.length} paciente{cp.patients.length !== 1 ? "s" : ""}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="px-4 py-3 space-y-3">
                      {cp.patients.map((p, j) => {
                        const pct = Math.round((p.receita / maxClinicRec) * 100);
                        return (
                          <div key={j}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                  style={{ backgroundColor: "#4CAF50" }}
                                >{j + 1}</span>
                                <span className="text-sm text-gray-700 truncate">{p.name}</span>
                              </div>
                              <span className="text-sm font-semibold flex-shrink-0 ml-3" style={{ color: "#4CAF50" }}>
                                {formatBRL(p.receita)}
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-gray-100">
                              <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: "#4CAF50" }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{p.sessoes !== 1 ? `${p.sessoes} sessões` : "1 sessão"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
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
                  <div key={i} className="py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      <span className="text-sm font-semibold flex-shrink-0" style={{ color: "#1a4a3a" }}>
                        {formatBRL(c.receita)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="text-xs text-gray-400">{c.sessoes} sessões</span>
                      <span className="text-xs font-medium" style={{ color: "#4CAF50" }}>{c.presenca}% presença</span>
                      {c.faltas > 0 && <span className="text-xs text-red-400">{c.faltas} falta{c.faltas !== 1 ? "s" : ""}</span>}
                      {c.cancelamentos > 0 && <span className="text-xs text-amber-500">{c.cancelamentos} cancel.</span>}
                      {c.reposicoes > 0 && <span className="text-xs text-blue-400">{c.reposicoes} repos.</span>}
                    </div>
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

        {/* Rankings assíduos e mais faltam */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Top 5 mais assíduos</h2>
            {topAssiduous.length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados no período.</p>
            ) : (
              <div className="space-y-2">
                {topAssiduous.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sessoes} sessões · {p.faltas} falta{p.faltas !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0FFF4", color: "#4CAF50" }}>
                      {p.presenca}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Top 5 que mais faltam</h2>
            {topAbsent.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma falta registrada.</p>
            ) : (
              <div className="space-y-2">
                {topAbsent.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <span className="text-sm font-bold flex-shrink-0 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
                      {p.faltas} falta{p.faltas !== 1 ? "s" : ""}
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

      {/* Print footer */}
      <div className="print-footer px-8 py-3 text-center border-t" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>Informação confidencial — uso exclusivo do profissional</p>
        <p className="text-xs" style={{ color: "#4CAF50", fontWeight: 600 }}>Acompanhamento Girassol — www.acompanhamentogirassol.com.br</p>
      </div>

    </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header({ aba }: { aba: string }) {
  return (
    <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #E5E7EB" }} className="px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/terapeuta"
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: "#6B7280" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Início
          </Link>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFBA3D18", color: "#FFBA3D" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.8} />
              <path d="M12 6v2m0 8v2M9.5 9.5A2.5 2.5 0 0 1 12 8h.5a2 2 0 0 1 0 4h-1a2 2 0 0 0 0 4h.5A2.5 2.5 0 0 0 14.5 14" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-bold text-lg" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>Financeiro</h1>
          <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "#F3F4F6" }}>
            {(["dashboard", "controle"] as const).map((a) => (
              <Link
                key={a}
                href={`/terapeuta/financeiro?aba=${a}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: aba === a ? "#1D3557" : "transparent",
                  color: aba === a ? "#fff" : "#6B7280",
                }}
              >
                {a === "dashboard" ? "Dashboard" : "Controle"}
              </Link>
            ))}
          </div>
        </div>
        {/* Pétala decorativa */}
        <div className="relative flex-shrink-0">
          <svg className="opacity-25 pointer-events-none" style={{ marginRight: -6, marginTop: -6 }} width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
            <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(0 26 26)" />
            <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFBA3D" transform="rotate(72 26 26)" />
            <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(144 26 26)" />
            <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFBA3D" transform="rotate(216 26 26)" />
            <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(288 26 26)" />
          </svg>
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  label, value, sub, highlight, danger, color: colorProp, tooltip,
}: {
  label: string; value: string; sub?: string; highlight?: boolean; danger?: boolean; color?: string; tooltip?: string;
}) {
  const color = colorProp ?? (highlight ? "#1a4a3a" : danger ? "#dc2626" : "#374151");
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between gap-1 mb-1">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        {tooltip && (
          <span
            title={tooltip}
            className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold cursor-help"
            style={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}
          >
            ?
          </span>
        )}
      </div>
      <p className="text-xl font-bold leading-tight" style={{ color, fontFamily: "var(--font-poppins, sans-serif)" }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

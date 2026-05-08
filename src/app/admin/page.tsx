import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import ImpersonateButton from "./ImpersonateButton";
import ApproveRejectButtons from "./ApproveRejectButtons";

const ADMIN_EMAIL = "dcchaves25@gmail.com";
const REVENUE_STATUS = ["completed", "makeup"];

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

function monthFullLabel(ym: string) {
  const [y, mo] = ym.split("-");
  const full = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${full[parseInt(mo) - 1]} ${y}`;
}

type StatCardProps = { label: string; value: string; color: string; bg: string };

function StatCard({ label, value, color, bg }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm p-5" style={{ backgroundColor: bg }}>
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold leading-tight" style={{ color, fontFamily: "var(--font-poppins, sans-serif)" }}>{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/terapeuta");

  const admin = createAdminClient();
  const ym = currentYearMonth();
  const { start, end } = monthRange(ym);

  const [usersRes, pendingRes, patientsRes, sessionsRes] = await Promise.all([
    admin.from("users").select("id, full_name, email, tenant_id, created_at").order("created_at", { ascending: false }),
    admin.from("pending_users").select("*").eq("status", "pendente").order("created_at", { ascending: false }),
    admin.from("patients").select("id, tenant_id").eq("status", "ativo"),
    admin
      .from("sessions")
      .select("id, status, tenant_id, patients(value_per_session_brl)")
      .gte("scheduled_at", start)
      .lte("scheduled_at", end),
  ]);

  const allUsers   = usersRes.data   ?? [];
  const pending    = pendingRes.data  ?? [];
  const allPatients = patientsRes.data ?? [];
  const allSessions = (sessionsRes.data ?? []) as unknown as Array<{
    id: string; status: string; tenant_id: string;
    patients: { value_per_session_brl: number | null } | null;
  }>;

  // Group patients by tenant
  const patientCountByTenant = new Map<string, number>();
  for (const p of allPatients) {
    if (!p.tenant_id) continue;
    patientCountByTenant.set(p.tenant_id, (patientCountByTenant.get(p.tenant_id) ?? 0) + 1);
  }

  // Group sessions by tenant
  const sessionStatsByTenant = new Map<string, { count: number; revenue: number }>();
  for (const s of allSessions) {
    if (!REVENUE_STATUS.includes(s.status) || !s.tenant_id) continue;
    const val = s.patients?.value_per_session_brl ?? 0;
    const cur = sessionStatsByTenant.get(s.tenant_id) ?? { count: 0, revenue: 0 };
    sessionStatsByTenant.set(s.tenant_id, { count: cur.count + 1, revenue: cur.revenue + val });
  }

  // Global totals
  const totalPacientes = allPatients.length;
  const totalSessoes   = allSessions.filter((s) => REVENUE_STATUS.includes(s.status)).length;
  const totalReceita   = allSessions
    .filter((s) => REVENUE_STATUS.includes(s.status))
    .reduce((sum, s) => sum + (s.patients?.value_per_session_brl ?? 0), 0);

  // Per-user stats
  const userStats = allUsers.map((u) => {
    const tid     = u.tenant_id as string | null ?? "";
    const pac     = patientCountByTenant.get(tid) ?? 0;
    const ses     = sessionStatsByTenant.get(tid) ?? { count: 0, revenue: 0 };
    return { ...u, totalPacientes: pac, sessoesMes: ses.count, receitaMes: ses.revenue };
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="max-w-4xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Painel Admin
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>

        {/* Visão consolidada */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Visão geral — {monthFullLabel(ym)}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total de pacientes" value={String(totalPacientes)} color="#4CAF50" bg="#F0FFF4" />
            <StatCard label="Sessões no mês" value={String(totalSessoes)} color="#2E7BC1" bg="#EFF6FF" />
            <StatCard label="Receita no mês" value={formatBRL(totalReceita)} color="#D97706" bg="#FFFBEB" />
          </div>
        </section>

        {/* Aprovações pendentes */}
        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "#FF5C7A" }}>
              Cadastros pendentes ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{p.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.email}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {p.profissao && <span className="text-xs text-gray-400">{p.profissao}</span>}
                      {p.plano && <span className="text-xs text-gray-400">Plano: {p.plano}</span>}
                      {p.telefone && <span className="text-xs text-gray-400">{p.telefone}</span>}
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <ApproveRejectButtons pendingId={p.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profissionais */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Profissionais ({userStats.length})
          </h2>
          <div className="space-y-3">
            {userStats.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: "#4CAF50" }}
                >
                  {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{u.full_name ?? "—"}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                    <span className="text-xs font-medium" style={{ color: "#4CAF50" }}>
                      {u.totalPacientes} {u.totalPacientes === 1 ? "paciente" : "pacientes"}
                    </span>
                    <span className="text-gray-300 text-xs">·</span>
                    <span className="text-xs font-medium" style={{ color: "#2E7BC1" }}>
                      {u.sessoesMes} {u.sessoesMes === 1 ? "sessão" : "sessões"} no mês
                    </span>
                    <span className="text-gray-300 text-xs">·</span>
                    <span className="text-xs font-medium" style={{ color: "#D97706" }}>
                      {formatBRL(u.receitaMes)} no mês
                    </span>
                  </div>
                </div>
                {u.id !== user.id ? (
                  <ImpersonateButton userId={u.id} userName={u.full_name ?? u.email ?? "Usuário"} />
                ) : (
                  <span className="text-xs text-gray-400 px-3 py-1.5 flex-shrink-0">Você</span>
                )}
              </div>
            ))}
            {userStats.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">Nenhum profissional cadastrado.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

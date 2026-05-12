import { createClient } from "@/lib/supabase/server";
import AgendaSemana from "./AgendaSemana";

export type AgendaSession = {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  patient_id: string;
  patients: { id: string; full_name: string } | null;
  clinics: { name: string } | null;
};

type Props = { searchParams: { semana?: string } };

function getMondayISO(dateISO?: string): string {
  const d = dateISO ? new Date(dateISO + "T12:00:00") : new Date();
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AgendaPage({ searchParams }: Props) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData, error: userErr } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (userErr) console.error("[AgendaPage] erro ao buscar tenant_id:", userErr.message, "user.id:", user.id);

  const tenantId = userData?.tenant_id ?? null;

  if (!tenantId) {
    console.error("[AgendaPage] tenant_id não encontrado para:", user.id);
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <p className="font-bold text-base mb-2" style={{ color: "#1D3557" }}>Configuração pendente</p>
          <p className="text-sm text-gray-500">Não foi possível identificar seu consultório. Verifique se seu cadastro está completo ou contate o suporte.</p>
          <p className="text-xs text-gray-400 mt-3 font-mono">{user.id}</p>
        </div>
      </div>
    );
  }
  const monday = getMondayISO(searchParams.semana);
  const nextMonday = addDaysISO(monday, 7);

  const { data: sessoes, error } = await supabase
    .from("sessions")
    .select("id, scheduled_at, status, duration_minutes, patient_id, patients(id, full_name), clinics(name)")
    .gte("scheduled_at", monday + "T00:00:00")
    .lt("scheduled_at", nextMonday + "T00:00:00")
    .order("scheduled_at");

  console.log("[DEBUG] sessoes:", sessoes?.length, "error:", error?.message, "monday:", monday);

  const sessions = (sessoes ?? []) as unknown as AgendaSession[];

  return (
    <AgendaSemana
      tenantId={tenantId}
      initialSessions={sessions}
      initialMonday={monday}
    />
  );
}

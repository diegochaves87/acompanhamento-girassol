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

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const tenantId = userData?.tenant_id ?? "";

  const monday = getMondayISO(searchParams.semana);
  const nextMonday = addDaysISO(monday, 7);

  const { data: sessoes } = await supabase
    .from("sessions")
    .select("id, scheduled_at, status, duration_minutes, patient_id, patients(id, full_name), clinics(name)")
    .eq("tenant_id", tenantId)
    .gte("scheduled_at", monday + "T00:00:00")
    .lt("scheduled_at", nextMonday + "T00:00:00")
    .order("scheduled_at");

  const sessions = (sessoes ?? []) as unknown as AgendaSession[];

  return (
    <AgendaSemana
      tenantId={tenantId}
      initialSessions={sessions}
      initialMonday={monday}
    />
  );
}

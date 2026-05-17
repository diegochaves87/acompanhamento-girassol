import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AgendaDia from "./AgendaDia";

export type DiaSession = {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  value_brl: number | null;
  absence_note: string | null;
  has_evolution: boolean | null;
  is_recurring: boolean | null;
  reposition_session_id: string | null;
  reposition_scheduled_at: string | null;
  patient_id: string;
  patients: { id: string; full_name: string; insurance_name: string | null } | null;
  clinics: { name: string } | null;
};

export type GuardianInfo = {
  patient_id: string;
  guardian_name: string | null;
  guardian_phone: string | null;
};

type Props = { params: { data: string } };

function formatDateLong(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AgendaDiaPage({ params }: Props) {
  const iso = params.data;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) notFound();

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const tenantId = userData?.tenant_id ?? "";

  const { data: sessoes, error } = await supabase
    .from("sessions")
    .select(
      "id, scheduled_at, status, duration_minutes, value_brl, absence_note, has_evolution, is_recurring, reposition_session_id, reposition_scheduled_at, patient_id, patients(id, full_name, insurance_name), clinics(name)"
    )
    .eq("tenant_id", tenantId)
    .gte("scheduled_at", iso + "T00:00:00")
    .lte("scheduled_at", iso + "T23:59:59")
    .order("scheduled_at");

  if (error) console.error("[AgendaDia]", error.message);

  const sessions = (sessoes ?? []) as unknown as DiaSession[];

  // Batch-fetch the scheduled_at of the original (lost) session for each makeup session
  const makeupLinkedIds = sessions
    .filter((s) => s.reposition_session_id)
    .map((s) => s.reposition_session_id as string);
  let linkedSessionDates: Record<string, string> = {};
  if (makeupLinkedIds.length > 0) {
    const { data: linked } = await supabase
      .from("sessions")
      .select("id, scheduled_at")
      .in("id", makeupLinkedIds);
    if (linked) {
      for (const l of linked) linkedSessionDates[l.id] = l.scheduled_at;
    }
  }

  const patientIdsSet = new Set(sessions.map((s) => s.patient_id));
  const patientIds = Array.from(patientIdsSet);
  let guardians: GuardianInfo[] = [];
  if (patientIds.length > 0) {
    const { data: gData } = await supabase
      .from("family_patient")
      .select("patient_id, guardian_name, guardian_phone")
      .in("patient_id", patientIds);
    guardians = (gData ?? []) as GuardianInfo[];
  }

  return (
    <AgendaDia
      dateISO={iso}
      dateLabel={formatDateLong(iso)}
      sessions={sessions}
      guardians={guardians}
      linkedSessionDates={linkedSessionDates}
    />
  );
}

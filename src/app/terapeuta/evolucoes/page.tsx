import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import EvolucoesList from "./EvolucoesList";

type Props = {
  searchParams: { aba?: string; sub?: string };
};

const ABAS = ["pendentes", "rascunhos", "publicadas"] as const;
type Aba = (typeof ABAS)[number];

const ABA_LABELS: Record<Aba, string> = {
  pendentes: "Pendentes",
  rascunhos: "Rascunhos",
  publicadas: "Publicadas",
};

export default async function EvolucoesPendentesPage({ searchParams }: Props) {
  const aba: Aba = (ABAS as readonly string[]).includes(searchParams.aba ?? "")
    ? (searchParams.aba as Aba)
    : "pendentes";
  const sub = aba === "publicadas" ? (searchParams.sub ?? "familia") : "familia";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  const tenantId = userData?.tenant_id ?? "";

  type PendingItem = { sessionId: string; scheduledAt: string; patientName: string };
  type EvoItem = {
    id: string;
    sessionId: string;
    patientName: string;
    scheduledAt: string;
    status: string;
    publishedToFamily: boolean;
  };

  let pendingItems: PendingItem[] = [];
  let evoItems: EvoItem[] = [];

  if (aba === "pendentes") {
    const [sessionsRes, evoIdsRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, scheduled_at, patient_id")
        .eq("tenant_id", tenantId)
        .in("status", ["completed", "makeup_completed"])
        .order("scheduled_at", { ascending: true }),
      supabase.from("evolutions").select("session_id").eq("tenant_id", tenantId),
    ]);

    const evolvedIds = new Set((evoIdsRes.data ?? []).map((e) => e.session_id));
    const sessions = (sessionsRes.data ?? []).filter((s) => !evolvedIds.has(s.id));

    const patientIds = Array.from(new Set(sessions.map((s) => s.patient_id)));
    const { data: patientsData } = patientIds.length
      ? await supabase.from("patients").select("id, full_name").in("id", patientIds)
      : { data: [] };
    const patientMap = new Map((patientsData ?? []).map((p) => [p.id, p.full_name as string]));

    pendingItems = sessions.map((s) => ({
      sessionId: s.id,
      scheduledAt: s.scheduled_at,
      patientName: patientMap.get(s.patient_id) ?? "—",
    }));
  } else {
    const statusFilter = aba === "rascunhos" ? "draft" : "published";
    const { data: evos } = await supabase
      .from("evolutions")
      .select("id, session_id, patient_id, status, created_at, published_to_family")
      .eq("tenant_id", tenantId)
      .eq("status", statusFilter)
      .order("created_at", { ascending: false });

    const evoList = evos ?? [];
    const sessionIds = Array.from(new Set(evoList.map((e) => e.session_id)));
    const patientIds = Array.from(new Set(evoList.map((e) => e.patient_id)));

    const [sessionsRes, patientsRes] = await Promise.all([
      sessionIds.length
        ? supabase.from("sessions").select("id, scheduled_at").in("id", sessionIds)
        : Promise.resolve({ data: [] as { id: string; scheduled_at: string }[] }),
      patientIds.length
        ? supabase.from("patients").select("id, full_name").in("id", patientIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    ]);

    const sessionMap = new Map((sessionsRes.data ?? []).map((s) => [s.id, s.scheduled_at]));
    const patientMap = new Map((patientsRes.data ?? []).map((p) => [p.id, p.full_name]));

    evoItems = evoList
      .map((e) => ({
        id: e.id,
        sessionId: e.session_id,
        patientName: patientMap.get(e.patient_id) ?? "—",
        scheduledAt: sessionMap.get(e.session_id) ?? "",
        status: e.status,
        publishedToFamily: e.published_to_family ?? false,
      }))
      .sort((a, b) => {
        const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return tb - ta;
      });
  }

  const totalCount = aba === "pendentes" ? pendingItems.length : evoItems.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <PageHeader
        title="Evoluções"
        subtitle={`${totalCount} registro${totalCount !== 1 ? "s" : ""}`}
        backHref="/terapeuta"
        backLabel="Início"
        iconColor="#8E6CCF"
        maxWidth="max-w-3xl"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        actions={
          <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ backgroundColor: "#F3F4F6" }}>
            {ABAS.map((a) => (
              <Link
                key={a}
                href={`/terapeuta/evolucoes?aba=${a}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: aba === a ? "#1D3557" : "transparent",
                  color: aba === a ? "#fff" : "#6B7280",
                }}
              >
                {ABA_LABELS[a]}
              </Link>
            ))}
          </div>
        }
      />

      <main className="max-w-3xl mx-auto px-6 py-6">
        <EvolucoesList
          aba={aba}
          sub={sub}
          pendingItems={pendingItems}
          evoItems={evoItems}
        />
      </main>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DespublicarButton from "./DespublicarButton";
import PageHeader from "@/components/PageHeader";

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

function formatDate(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default async function EvolucoesPendentesPage({ searchParams }: Props) {
  const aba: Aba = (ABAS as readonly string[]).includes(searchParams.aba ?? "")
    ? (searchParams.aba as Aba)
    : "pendentes";
  const sub = aba === "publicadas" ? (searchParams.sub ?? "familia") : "familia";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  const tenantId = userData?.tenant_id ?? "";

  type PendingItem = {
    sessionId: string;
    scheduledAt: string;
    patientName: string;
  };
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
      .order("created_at", { ascending: true });

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

    const sessionMap = new Map(
      (sessionsRes.data ?? []).map((s) => [s.id, s.scheduled_at])
    );
    const patientMap = new Map(
      (patientsRes.data ?? []).map((p) => [p.id, p.full_name])
    );

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
        return ta - tb; // ascendente: mais antigas primeiro
      });
  }

  const familiaItems = aba === "publicadas" ? evoItems.filter((e) => e.publishedToFamily) : [];
  const semItems = aba === "publicadas" ? evoItems.filter((e) => !e.publishedToFamily) : [];
  const displayedEvoItems = aba === "publicadas" ? (sub === "sem" ? semItems : familiaItems) : evoItems;

  const totalCount =
    aba === "pendentes" ? pendingItems.length : evoItems.length;

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

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-3">
        {aba === "pendentes" && pendingItems.length === 0 && (
          <EmptyCard message="Nenhuma sessão realizada aguarda evolução." />
        )}

        {aba === "publicadas" && (
          <div className="flex gap-2">
            <Link
              href="/terapeuta/evolucoes?aba=publicadas&sub=familia"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border"
              style={{
                backgroundColor: sub === "familia" ? "#1D3557" : "#fff",
                color: sub === "familia" ? "#fff" : "#6B7280",
                borderColor: sub === "familia" ? "#1D3557" : "#E5E7EB",
              }}
            >
              Para a família ({familiaItems.length})
            </Link>
            <Link
              href="/terapeuta/evolucoes?aba=publicadas&sub=sem"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border"
              style={{
                backgroundColor: sub === "sem" ? "#1D3557" : "#fff",
                color: sub === "sem" ? "#fff" : "#6B7280",
                borderColor: sub === "sem" ? "#1D3557" : "#E5E7EB",
              }}
            >
              Sem publicação ({semItems.length})
            </Link>
          </div>
        )}

        {aba === "rascunhos" && evoItems.length === 0 && (
          <EmptyCard message="Nenhum rascunho salvo." />
        )}

        {aba === "publicadas" && displayedEvoItems.length === 0 && (
          <EmptyCard
            message={
              sub === "sem"
                ? "Nenhuma evolução salva sem publicação para a família."
                : "Nenhuma evolução publicada para a família."
            }
          />
        )}

        {aba === "pendentes" &&
          pendingItems.map((item) => (
            <div
              key={item.sessionId}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {item.patientName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(item.scheduledAt)}
                </p>
              </div>
              <Link
                href={`/terapeuta/evolucoes/nova?sessao=${item.sessionId}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Registrar
              </Link>
            </div>
          ))}

        {aba !== "pendentes" &&
          displayedEvoItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 truncate">
                    {item.patientName}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === "published"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}
                  >
                    {item.status === "published" ? "PUBLICADA" : "RASCUNHO"}
                  </span>
                </div>
                {item.scheduledAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(item.scheduledAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.status === "published" && (
                  <DespublicarButton evolucaoId={item.id} />
                )}
                <Link
                  href={
                    item.status === "published"
                      ? `/terapeuta/evolucoes/${item.id}`
                      : `/terapeuta/evolucoes/nova?sessao=${item.sessionId}&evolution=${item.id}`
                  }
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {item.status === "draft" ? "Continuar" : "Ver"}
                </Link>
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: "#e8f0ec" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#1a4a3a"
          strokeWidth={1.6}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="font-semibold text-gray-600 mb-1">Tudo em dia</p>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

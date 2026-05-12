import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import LiberarAcessoButton from "./LiberarAcessoButton";
import InativarPacienteButton from "./InativarPacienteButton";
import NotasTab from "./NotasTab";
import ArquivosTab from "./ArquivosTab";
import RelatoriosTab from "./RelatoriosTab";
import ConvidarFamiliarModal from "./ConvidarFamiliarModal";
import AprovarFamiliarButton from "./AprovarFamiliarButton";
import PacienteAvatarUpload from "./PacienteAvatarUpload";
import PublicarNotaToggle from "./PublicarNotaToggle";
import FamiliaPreviewModal from "./FamiliaPreviewModal";
import { statusLabel, statusClassName } from "@/lib/session-status";

type Props = { params: { id: string }; searchParams: { aba?: string } };

const ABAS = ["dados", "anamnese", "agenda", "evolucoes", "notas", "arquivos", "relatorios", "familia"] as const;
type Aba = (typeof ABAS)[number];

const ABA_LABELS: Record<Aba, string> = {
  dados: "Dados",
  anamnese: "Anamnese",
  agenda: "Agenda",
  evolucoes: "Evoluções",
  notas: "Anotações",
  arquivos: "Arquivos",
  relatorios: "Relatórios",
  familia: "Família",
};

type FamilyMember = {
  id: string;
  nome: string;
  email: string;
  relacao: string | null;
  status: string;
  created_at: string;
};


type AgendaSession = {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  clinics: { name: string } | null;
};

type CompletedSession = {
  id: string;
  scheduled_at: string;
  clinics: { name: string } | null;
};

type EvoItem = {
  id: string;
  status: string;
  updated_at: string | null;
  session_id: string;
};

type Note = {
  id: string;
  technical_note: string;
  created_at: string;
  profiles?: { full_name: string } | null;
};

type FamiliaEvo = {
  id: string;
  status: string;
  updated_at: string | null;
  session_id: string;
  published_to_family: boolean | null;
  sessions: { scheduled_at: string } | null;
};

type NextSession = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  clinics: { name: string } | null;
};

function diagnosisBadgeClass(d: string): string {
  const key = d.toLowerCase().replace(/\s/g, "");
  const map: Record<string, string> = {
    tea: "bg-blue-100 text-blue-800",
    autismo: "bg-blue-100 text-blue-800",
    tdah: "bg-amber-100 text-amber-800",
    tda: "bg-orange-100 text-orange-800",
    dislexia: "bg-purple-100 text-purple-800",
    tdl: "bg-pink-100 text-pink-800",
    toc: "bg-red-100 text-red-800",
    ansiedade: "bg-rose-100 text-rose-800",
    dpac: "bg-cyan-100 text-cyan-800",
  };
  return map[key] ?? "bg-teal-100 text-teal-800";
}

function supportLevelBadgeClass(level: string): string {
  const n = level.replace(/\D/g, "");
  if (n === "1") return "bg-green-100 text-green-800";
  if (n === "2") return "bg-amber-100 text-amber-800";
  if (n === "3") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

function formatCpf(digits: string) {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatScheduledAt(scheduledAt: string, durationMinutes?: number | null) {
  const d = new Date(scheduledAt);
  const weekdays = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
  const weekday = weekdays[d.getUTCDay()];
  const date = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const startTime = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  const end = new Date(d.getTime() + (durationMinutes ?? 30) * 60000);
  const endTime = `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`;
  const time = `${startTime} – ${endTime}`;
  return { weekday, date, time };
}

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function waLink(phone: string) {
  return `https://wa.me/55${phone.replace(/\D/g, "")}`;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

function PlaceholderTab({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-16 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#e8f0ec" }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#1a4a3a" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
        </svg>
      </div>
      <p className="font-semibold text-gray-600 mb-1">{title}</p>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export default async function PacientePerfilPage({ params, searchParams }: Props) {
  const aba: Aba = (ABAS as readonly string[]).includes(searchParams.aba ?? "")
    ? (searchParams.aba as Aba)
    : "dados";

  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*, clinics(name)")
    .eq("id", params.id)
    .single();

  if (error || !patient) notFound();

  const patientTenantId = (patient as Record<string, unknown>).tenant_id as string ?? "";

  const [
    guardianRes,
    agendaRes,
    completedRes,
    evosRes,
    notasRes,
    familyRes,
    feedEvosRes,
    nextSessionRes,
  ] = await Promise.all([
    supabase
      .from("family_patient")
      .select("guardian_name, guardian_phone, guardian_email, guardian_relationship, invited_at")
      .eq("patient_id", params.id)
      .maybeSingle(),

    aba === "agenda"
      ? supabase
          .from("sessions")
          .select("id, scheduled_at, status, duration_minutes, clinics(name)")
          .eq("patient_id", params.id)
          .order("scheduled_at", { ascending: true })
          .limit(50)
      : Promise.resolve({ data: [] as AgendaSession[] }),

    aba === "evolucoes"
      ? supabase
          .from("sessions")
          .select("id, scheduled_at, clinics(name)")
          .eq("patient_id", params.id)
          .eq("status", "completed")
          .order("scheduled_at", { ascending: false })
      : Promise.resolve({ data: [] as CompletedSession[] }),

    aba === "evolucoes"
      ? supabase
          .from("evolutions")
          .select("id, status, updated_at, session_id")
          .eq("patient_id", params.id)
      : Promise.resolve({ data: [] as EvoItem[] }),

    aba === "notas"
      ? supabase
          .from("multidisciplinary_notes")
          .select("id, technical_note, created_at, profiles!author_id(full_name)")
          .eq("patient_id", params.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Note[] }),

    supabase
      .from("family_access")
      .select("id, nome, email, relacao, status, created_at")
      .eq("patient_id", params.id)
      .order("created_at", { ascending: false }),

    aba === "familia"
      ? supabase
          .from("evolutions")
          .select("id, status, updated_at, session_id, published_to_family, sessions(scheduled_at)")
          .eq("patient_id", params.id)
          .order("updated_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as FamiliaEvo[] }),

    aba === "familia"
      ? supabase
          .from("sessions")
          .select("id, scheduled_at, duration_minutes, clinics(name)")
          .eq("patient_id", params.id)
          .in("status", ["scheduled", "confirmed"])
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null as NextSession | null }),
  ]);

  const guardian = guardianRes.data;
  const agendaSessions = (agendaRes.data ?? []) as AgendaSession[];
  const completedSessions = (completedRes.data ?? []) as CompletedSession[];
  const evos = (evosRes.data ?? []) as EvoItem[];
  const notas = (notasRes.data ?? []) as Note[];
  const familyMembers = (familyRes.data ?? []) as FamilyMember[];
  const familiaEvos = (feedEvosRes.data ?? []) as FamiliaEvo[];
  const nextSession = nextSessionRes.data as NextSession | null;

  const evoBySessionId = new Map(evos.map((e) => [e.session_id, e]));

  const clinicName = (patient.clinics as { name: string } | null)?.name ?? null;
  const diagnoses: string[] = patient.diagnosis ?? [];
  const supportLevel = (patient as Record<string, unknown>).support_level as string | null ?? null;
  const initial = patient.full_name.trim().charAt(0).toUpperCase();
  const tenantId = patientTenantId;
  const fotoUrl = (patient as Record<string, unknown>).foto_url as string | null ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>

      {/* ── Profile header ── */}
      <div style={{ backgroundColor: "#1a4a3a" }}>
        <div className="max-w-3xl mx-auto px-6 pt-4 pb-0">

          {/* Back */}
          <Link
            href={aba === "agenda" ? "/terapeuta/agenda" : "/terapeuta/pacientes"}
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors mb-5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {aba === "agenda" ? "← Voltar para Agenda" : "Pacientes"}
          </Link>

          {/* Avatar + info */}
          <div className="flex items-start gap-5 mb-5">
            <PacienteAvatarUpload patientId={params.id} initial={initial} fotoUrl={fotoUrl} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h1 className="text-white font-bold text-xl leading-tight">{patient.full_name}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ConvidarFamiliarModal
                    patientId={params.id}
                    patientName={patient.full_name}
                    guardianName={guardian?.guardian_name ?? null}
                    guardianEmail={guardian?.guardian_email ?? null}
                    guardianPhone={guardian?.guardian_phone ?? null}
                  />
                  <Link
                    href={`/terapeuta/pacientes/${params.id}/editar`}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white border border-white/20 hover:border-white/40 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </Link>
                </div>
              </div>

              {(diagnoses.length > 0 || supportLevel) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {diagnoses.map((d) => (
                    <span key={d} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${diagnosisBadgeClass(d)}`}>
                      {d}
                    </span>
                  ))}
                  {supportLevel && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${supportLevelBadgeClass(supportLevel)}`}>
                      Nível {supportLevel}
                    </span>
                  )}
                </div>
              )}

              {guardian && (
                <div className="mt-3 space-y-1.5">
                  {guardian.guardian_name && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/75 text-sm">{guardian.guardian_name}</span>
                      {guardian.guardian_relationship && (
                        <span className="text-white/40 text-xs">{guardian.guardian_relationship}</span>
                      )}
                      {guardian.guardian_phone && (
                        <a href={waLink(guardian.guardian_phone)} target="_blank" rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 transition-colors" title="Abrir WhatsApp">
                          <WhatsAppIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                  {guardian.guardian_phone && (
                    <a href={waLink(guardian.guardian_phone)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-white/55 hover:text-green-300 text-sm transition-colors">
                      <WhatsAppIcon className="w-3.5 h-3.5 text-green-400" />
                      {guardian.guardian_phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div
            className="flex overflow-x-auto border-b border-white/10 -mx-6 px-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {ABAS.map((a) => (
              <Link
                key={a}
                href={`/terapeuta/pacientes/${params.id}?aba=${a}`}
                className={`flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  aba === a
                    ? "text-white border-[#4CAF50]"
                    : "text-white/45 border-transparent hover:text-white/75 hover:border-white/20"
                }`}
              >
                {ABA_LABELS[a]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <main className="max-w-3xl mx-auto px-6 py-6 space-y-4">

        {/* ── DADOS ── */}
        {aba === "dados" && (
          <>
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Informações clínicas</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {diagnoses.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-400 mb-1">Diagnóstico</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {diagnoses.map((d) => (
                        <span key={d} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${diagnosisBadgeClass(d)}`}>
                          {d}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {supportLevel && (
                  <div>
                    <dt className="text-gray-400 mb-1">Nível de suporte</dt>
                    <dd>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${supportLevelBadgeClass(supportLevel)}`}>
                        Nível {supportLevel}
                      </span>
                    </dd>
                  </div>
                )}
                {clinicName && (
                  <div>
                    <dt className="text-gray-400 mb-0.5">Clínica</dt>
                    <dd className="font-medium text-gray-800">{clinicName}</dd>
                  </div>
                )}
                {patient.insurance_name && (
                  <div>
                    <dt className="text-gray-400 mb-0.5">Convênio</dt>
                    <dd className="font-medium text-gray-800">{patient.insurance_name}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Dados pessoais</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {patient.birth_date && (
                  <div>
                    <dt className="text-gray-400 mb-0.5">Data de nascimento</dt>
                    <dd className="font-medium text-gray-800">{formatDate(patient.birth_date)}</dd>
                  </div>
                )}
                {patient.cpf && (
                  <div>
                    <dt className="text-gray-400 mb-0.5">CPF</dt>
                    <dd className="font-medium text-gray-800">{formatCpf(patient.cpf)}</dd>
                  </div>
                )}
              </dl>
              {!patient.birth_date && !patient.cpf && (
                <p className="text-sm text-gray-400">Nenhum dado pessoal cadastrado.</p>
              )}
            </section>

            {patient.notes && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Observações</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{patient.notes}</p>
              </section>
            )}

            {guardian?.guardian_email && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Acesso familiar</h2>
                <LiberarAcessoButton
                  patientId={params.id}
                  guardianEmail={guardian.guardian_email}
                  guardianName={guardian.guardian_name}
                  invitedAt={guardian.invited_at ?? null}
                />
              </section>
            )}

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <InativarPacienteButton patientId={params.id} />
            </section>
          </>
        )}

        {/* ── ANAMNESE ── */}
        {aba === "anamnese" && (
          <PlaceholderTab title="Anamnese" message="Aguardando preenchimento pelo responsável." />
        )}

        {/* ── AGENDA ── */}
        {aba === "agenda" && (
          <div className="space-y-3">
            {agendaSessions.length > 0 && (
              <section className="space-y-3">
                {agendaSessions.map((s) => {
                  const { weekday, date, time } = formatScheduledAt(s.scheduled_at, s.duration_minutes);
                  const clinic = (s.clinics as { name: string } | null)?.name ?? null;
                  return (
                    <Link
                      key={s.id}
                      href={`/terapeuta/pacientes/${params.id}/sessoes/${s.id}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center flex-shrink-0">
                          <p className="text-xs text-gray-400 capitalize">{weekday}</p>
                          <p className="text-lg font-bold leading-tight" style={{ color: "#1a4a3a" }}>{date.split("/")[0]}</p>
                          <p className="text-xs text-gray-400">{date.split("/").slice(1).join("/")}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{time}</p>
                          {clinic && <p className="text-xs text-gray-400 mt-0.5">{clinic}</p>}
                          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusClassName(s.status)}`}>
                            {statusLabel(s.status)}
                          </span>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              </section>
            )}

            {agendaSessions.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10 text-center">
                <p className="font-semibold text-gray-600 mb-1">Nenhuma sessão encontrada</p>
                <p className="text-sm text-gray-400 mb-5">Ainda não há sessões registradas para este paciente.</p>
              </div>
            )}

            <Link
              href="/terapeuta/agenda"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
              </svg>
              Ir para a Agenda
            </Link>
          </div>
        )}

        {/* ── EVOLUÇÕES ── */}
        {aba === "evolucoes" && (
          <>
            {completedSessions.length === 0 ? (
              <PlaceholderTab title="Nenhuma sessão realizada" message="As evoluções aparecerão aqui após a realização de sessões." />
            ) : (
              <div className="space-y-3">
                {completedSessions.map((session) => {
                  const evo = evoBySessionId.get(session.id);
                  const { weekday, date, time } = formatScheduledAt(session.scheduled_at);
                  const clinic = (session.clinics as { name: string } | null)?.name ?? null;
                  const sessionLabel = `${weekday} ${date} às ${time}`;

                  if (evo) {
                    const href =
                      evo.status === "published"
                        ? `/terapeuta/evolucoes/${evo.id}`
                        : `/terapeuta/evolucoes/nova?sessao=${session.id}&evolution=${evo.id}`;
                    return (
                      <Link key={session.id} href={href}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm">{sessionLabel}</p>
                          {clinic && <p className="text-xs text-gray-400 mt-0.5">{clinic}</p>}
                          {evo.updated_at && (
                            <p className="text-xs text-gray-400">Atualizada em {formatUpdatedAt(evo.updated_at)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            evo.status === "published"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {evo.status === "published" ? "PUBLICADA" : "RASCUNHO"}
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{sessionLabel}</p>
                        {clinic && <p className="text-xs text-gray-400 mt-0.5">{clinic}</p>}
                      </div>
                      <Link
                        href={`/terapeuta/evolucoes/nova?sessao=${session.id}`}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Registrar
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── NOTAS ── */}
        {aba === "notas" && (
          <NotasTab patientId={params.id} tenantId={tenantId} initialNotes={notas} />
        )}

        {/* ── ARQUIVOS ── */}
        {aba === "arquivos" && (
          <ArquivosTab patientId={params.id} />
        )}

        {/* ── RELATÓRIOS ── */}
        {aba === "relatorios" && (
          <RelatoriosTab patientId={params.id} tenantId={tenantId} patientName={patient.full_name} />
        )}

        {/* ── FAMÍLIA ── */}
        {aba === "familia" && (
          <div className="space-y-4">

            {/* Acessos familiares */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Acessos ao portal</h2>
                <FamiliaPreviewModal
                  patientName={patient.full_name}
                  initial={initial}
                  fotoUrl={fotoUrl}
                  diagnoses={diagnoses}
                  nextSession={nextSession}
                  familiaEvos={familiaEvos}
                />
              </div>
              {familyMembers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm font-medium text-gray-500 mb-1">Nenhum familiar convidado ainda</p>
                  <p className="text-xs text-gray-400">Use o botão &ldquo;Convidar familiar&rdquo; no topo para enviar o primeiro convite.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {familyMembers.map((member) => {
                    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                      pendente: { label: "Convite enviado", color: "#D97706", bg: "#FFFBEB" },
                      aguardando_aprovacao: { label: "Aguardando aprovação", color: "#2E7BC1", bg: "#EFF6FF" },
                      ativo: { label: "Ativo", color: "#166534", bg: "#F0FFF4" },
                      bloqueado: { label: "Bloqueado", color: "#DC2626", bg: "#FEF2F2" },
                    };
                    const st = statusMap[member.status] ?? statusMap.pendente;
                    return (
                      <div key={member.id} className="flex items-center justify-between gap-4 flex-wrap py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: "#4CAF50" }}>
                            {member.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{member.nome}</p>
                            <p className="text-xs text-gray-400">{member.email}{member.relacao ? ` · ${member.relacao}` : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                          {member.status === "aguardando_aprovacao" && (
                            <AprovarFamiliarButton accessId={member.id} nome={member.nome} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Próxima sessão */}
            {nextSession && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Próxima sessão</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EFF6FF" }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#2E7BC1" }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.8} />
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{formatScheduledAt(nextSession.scheduled_at, nextSession.duration_minutes).weekday} {formatScheduledAt(nextSession.scheduled_at, nextSession.duration_minutes).date} às {formatScheduledAt(nextSession.scheduled_at, nextSession.duration_minutes).time}</p>
                    {nextSession.clinics && <p className="text-xs text-gray-400 mt-0.5">{(nextSession.clinics as { name: string }).name}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* Evoluções para a família */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Evoluções publicadas</h2>
                <Link
                  href={`/terapeuta/pacientes/${params.id}?aba=evolucoes`}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Ver evoluções →
                </Link>
              </div>
              {familiaEvos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F3F0FF" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: "#8E6CCF" }}>
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Nenhuma evolução publicada para a família ainda.</p>
                  <p className="text-xs text-gray-400">Use o toggle &ldquo;Publicar&rdquo; em cada evolução para torná-la visível no portal da família.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {familiaEvos.map((evo) => {
                    const publicado = evo.published_to_family ?? false;
                    const sessionDate = evo.sessions?.scheduled_at
                      ? formatScheduledAt(evo.sessions.scheduled_at)
                      : null;
                    const isPublished = evo.status === "published";
                    const href = isPublished
                      ? `/terapeuta/evolucoes/${evo.id}`
                      : `/terapeuta/evolucoes/nova?sessao=${evo.session_id}&evolution=${evo.id}`;
                    return (
                      <div key={evo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {sessionDate && (
                              <p className="text-sm font-medium text-gray-800">
                                Sessão de {sessionDate.weekday} {sessionDate.date} às {sessionDate.time}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isPublished
                                  ? "bg-green-50 text-green-700 border-green-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                                {isPublished ? "PUBLICADA" : "RASCUNHO"}
                              </span>
                              {evo.updated_at && (
                                <span className="text-xs text-gray-400">
                                  {formatUpdatedAt(evo.updated_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <PublicarNotaToggle
                              noteId={evo.id}
                              publicado={publicado}
                              patientId={params.id}
                            />
                            <a href={href} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                              Ver →
                            </a>
                          </div>
                        </div>
                        {publicado && (
                          <p className="text-xs text-green-600 font-medium mt-2">· Visível no portal da família</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        )}

      </main>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import LiberarAcessoButton from "./LiberarAcessoButton";
import InativarPacienteButton from "./InativarPacienteButton";
import { statusLabel, statusClassName } from "@/lib/session-status";

type Props = { params: { id: string }; searchParams: { aba?: string } };

const CONTRACT_LABEL: Record<string, string> = {
  particular: "Particular",
  convenio: "Convênio",
};

function formatCpf(digits: string) {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatScheduledAt(scheduledAt: string) {
  const d = new Date(scheduledAt);
  const date = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${date} às ${time}`;
}

type SessionRow = {
  id: string;
  scheduled_at: string;
  status: string;
  clinics: { name: string } | null;
};

export default async function PacientePerfilPage({ params, searchParams }: Props) {
  const aba = searchParams.aba === "atendimentos" ? "atendimentos" : "cadastro";
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*, clinics(name)")
    .eq("id", params.id)
    .single();

  if (error || !patient) notFound();

  const [guardianRes, sessionsRes] = await Promise.all([
    supabase
      .from("family_patient")
      .select("guardian_name, guardian_phone, guardian_email, guardian_relationship, invited_at")
      .eq("patient_id", params.id)
      .maybeSingle(),
    aba === "atendimentos"
      ? supabase
          .from("sessions")
          .select("id, scheduled_at, status, clinics(name)")
          .eq("patient_id", params.id)
          .order("scheduled_at", { ascending: false })
      : Promise.resolve({ data: [] as SessionRow[] }),
  ]);

  const guardian = guardianRes.data;
  const sessions = (sessionsRes.data ?? []) as SessionRow[];
  const clinicName = (patient.clinics as { name: string } | null)?.name ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/terapeuta/pacientes" className="text-white/60 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-white font-semibold truncate">{patient.full_name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/terapeuta/pacientes/${params.id}?aba=atendimentos`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                </svg>
                Ver atendimentos
              </Link>
              <Link
                href={`/terapeuta/pacientes/${params.id}/editar`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
            </div>
          </div>
          <div className="flex gap-1 bg-white/10 rounded-xl p-1 w-fit">
            <Link
              href={`/terapeuta/pacientes/${params.id}`}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                aba === "cadastro"
                  ? "text-white bg-white/20"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Cadastro
            </Link>
            <Link
              href={`/terapeuta/pacientes/${params.id}?aba=atendimentos`}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                aba === "atendimentos"
                  ? "text-white bg-white/20"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Atendimentos
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {aba === "cadastro" && (
          <>
            {/* Dados pessoais */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold mb-4" style={{ color: "#1a4a3a" }}>Dados do paciente</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-gray-400 mb-0.5">Nome completo</dt>
                  <dd className="font-medium text-gray-800">{patient.full_name}</dd>
                </div>
                {patient.cpf && (
                  <div>
                    <dt className="text-gray-400 mb-0.5">CPF</dt>
                    <dd className="font-medium text-gray-800">{formatCpf(patient.cpf)}</dd>
                  </div>
                )}
                {patient.birth_date && (
                  <div>
                    <dt className="text-gray-400 mb-0.5">Data de nascimento</dt>
                    <dd className="font-medium text-gray-800">{formatDate(patient.birth_date)}</dd>
                  </div>
                )}
                {patient.diagnosis?.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-400 mb-0.5">Diagnóstico</dt>
                    <dd className="font-medium text-gray-800">{patient.diagnosis.join(", ")}</dd>
                  </div>
                )}
                {clinicName && (
                  <div>
                    <dt className="text-gray-400 mb-0.5">Clínica</dt>
                    <dd className="font-medium text-gray-800">{clinicName}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Pagamento */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold mb-4" style={{ color: "#1a4a3a" }}>Pagamento</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-gray-400 mb-0.5">Tipo</dt>
                  <dd className="font-medium text-gray-800">
                    {CONTRACT_LABEL[patient.payment_type] ?? patient.payment_type ?? "—"}
                  </dd>
                </div>
                {patient.value_per_session_brl != null && (
                  <div>
                    <dt className="text-gray-400 mb-0.5">Valor por sessão</dt>
                    <dd className="font-medium text-gray-800">
                      {patient.value_per_session_brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </dd>
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

            {/* Responsável */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold mb-4" style={{ color: "#1a4a3a" }}>Responsável</h2>
              {guardian ? (
                <div className="space-y-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    {guardian.guardian_name && (
                      <div>
                        <dt className="text-gray-400 mb-0.5">Nome</dt>
                        <dd className="font-medium text-gray-800">{guardian.guardian_name}</dd>
                      </div>
                    )}
                    {guardian.guardian_relationship && (
                      <div>
                        <dt className="text-gray-400 mb-0.5">Parentesco</dt>
                        <dd className="font-medium text-gray-800">{guardian.guardian_relationship}</dd>
                      </div>
                    )}
                    {guardian.guardian_phone && (
                      <div>
                        <dt className="text-gray-400 mb-0.5">Telefone</dt>
                        <dd className="font-medium text-gray-800">{guardian.guardian_phone}</dd>
                      </div>
                    )}
                    {guardian.guardian_email && (
                      <div>
                        <dt className="text-gray-400 mb-0.5">E-mail</dt>
                        <dd className="font-medium text-gray-800">{guardian.guardian_email}</dd>
                      </div>
                    )}
                  </dl>
                  {guardian.guardian_email ? (
                    <LiberarAcessoButton
                      patientId={params.id}
                      guardianEmail={guardian.guardian_email}
                      guardianName={guardian.guardian_name}
                      invitedAt={guardian.invited_at ?? null}
                    />
                  ) : (
                    <p className="text-sm text-gray-400">
                      Sem e-mail cadastrado — acesso ao app não pode ser liberado.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Nenhum responsável cadastrado.</p>
              )}
            </section>

            {/* Observações */}
            {patient.notes && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-semibold mb-3" style={{ color: "#1a4a3a" }}>Observações</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{patient.notes}</p>
              </section>
            )}

            {/* Inativar */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <InativarPacienteButton patientId={params.id} />
            </section>
          </>
        )}

        {aba === "atendimentos" && (
          <>
            {sessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#e8f0ec" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#1a4a3a" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-600 mb-1">Nenhum atendimento</p>
                <p className="text-sm text-gray-400">Este paciente ainda não possui sessões registradas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => {
                  const clinicLabel = (s.clinics as { name: string } | null)?.name ?? null;
                  return (
                    <Link
                      key={s.id}
                      href={`/terapeuta/pacientes/${params.id}/sessoes/${s.id}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{formatScheduledAt(s.scheduled_at)}</p>
                        {clinicLabel && (
                          <p className="text-xs text-gray-400 mt-0.5">{clinicLabel}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClassName(s.status)}`}>
                          {statusLabel(s.status)}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}

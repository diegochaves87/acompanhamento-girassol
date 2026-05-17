"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  SESSION_STATUS_OPTIONS,
  statusBadge,
  statusClassName,
  NEEDS_NOTES,
  type SessionStatus,
} from "@/lib/session-status";
import type { DiaSession, GuardianInfo } from "./page";

type Props = {
  dateISO: string;
  dateLabel: string;
  sessions: DiaSession[];
  guardians: GuardianInfo[];
  linkedSessionDates: Record<string, string>;
};

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function formatPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function buildWhatsappLink(phone: string, patientName: string, dateLabel: string, time: string): string {
  const text = encodeURIComponent(
    `Olá! Passando para confirmar a sessão de ${patientName} em ${dateLabel} às ${time}. Por favor, confirme a presença respondendo esta mensagem. Obrigado!`
  );
  return `https://wa.me/55${formatPhone(phone)}?text=${text}`;
}

type SessionCardState = {
  status: SessionStatus;
  absenceNote: string;
  saving: boolean;
  saved: boolean;
  erro: string;
};

const FUTURE_FORBIDDEN: SessionStatus[] = [
  "completed",
  "unjustified_absence",
  "justified_absence",
  "cancelled_family",
];

function formatDatePT(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export default function AgendaDia({ dateISO, dateLabel, sessions, guardians, linkedSessionDates }: Props) {
  const guardianMap = new Map<string, GuardianInfo>(
    guardians.map((g) => [g.patient_id, g])
  );
  const sessionDateMap = new Map(sessions.map((s) => [s.id, s.scheduled_at]));
  const sessionDataMap = new Map(sessions.map((s) => [s.id, s]));

  const [cardStates, setCardStates] = useState<Record<string, SessionCardState>>(
    () =>
      Object.fromEntries(
        sessions.map((s) => [
          s.id,
          {
            status: s.status as SessionStatus,
            absenceNote: s.absence_note ?? "",
            saving: false,
            saved: false,
            erro: "",
          },
        ])
      )
  );

  function updateCard(id: string, patch: Partial<SessionCardState>) {
    setCardStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveStatus(sessionId: string) {
    const state = cardStates[sessionId];
    const session = sessionDataMap.get(sessionId);

    const scheduledAt = sessionDateMap.get(sessionId);
    if (scheduledAt && new Date(scheduledAt).getTime() > Date.now() && FUTURE_FORBIDDEN.includes(state.status)) {
      updateCard(sessionId, { erro: "Não é possível finalizar uma sessão futura. Aguarde o horário da sessão." });
      return;
    }

    updateCard(sessionId, { saving: true, erro: "" });
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({
        status: state.status,
        absence_note: NEEDS_NOTES.includes(state.status) ? state.absenceNote || null : null,
      })
      .eq("id", sessionId);
    if (error) {
      updateCard(sessionId, { saving: false, erro: error.message });
      return;
    }

    // When a makeup session is marked as completed, mark the linked lost session as 'reposta'
    if (state.status === "makeup_completed" && session?.reposition_session_id) {
      const { data: orig } = await supabase
        .from("sessions")
        .select("status")
        .eq("id", session.reposition_session_id)
        .single();
      await supabase
        .from("sessions")
        .update({
          status: "reposta",
          original_status: orig?.status ?? null,
          reposition_scheduled_at: session.scheduled_at,
        })
        .eq("id", session.reposition_session_id);
    }

    updateCard(sessionId, { saving: false, saved: true });
    setTimeout(() => updateCard(sessionId, { saved: false }), 3000);
  }

  const prevDay = addDaysISO(dateISO, -1);
  const nextDay = addDaysISO(dateISO, 1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link href="/terapeuta/agenda" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Semana
            </Link>
            <div className="flex gap-1 bg-white/10 rounded-xl p-1">
              <Link href="/terapeuta/agenda" className="px-3 py-1 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">Semana</Link>
              <Link href="/terapeuta/agenda/atendimentos" className="px-3 py-1 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">Atendimentos</Link>
              <Link
                href="/terapeuta/agenda/sessoes"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#4CAF50" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Sessões
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-semibold capitalize">{dateLabel}</h1>
              <p className="text-white/60 text-xs mt-0.5">{sessions.length !== 1 ? `${sessions.length} sessões` : "1 sessão"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/terapeuta/agenda/dia/${prevDay}`} className="text-white/60 hover:text-white transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <Link href={`/terapeuta/agenda/dia/${nextDay}`} className="text-white/60 hover:text-white transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 text-center">
            <p className="font-semibold text-gray-600 mb-1">Nenhuma sessão neste dia</p>
            <p className="text-sm text-gray-400">Sem sessões agendadas para {dateLabel}.</p>
          </div>
        ) : (
          sessions.map((s) => {
            const state = cardStates[s.id];
            const guardian = guardianMap.get(s.patient_id);
            const time = formatTime(s.scheduled_at);
            const needsNote = NEEDS_NOTES.includes(state.status);
            const showWhatsApp =
              state.status === "scheduled" &&
              guardian?.guardian_phone;

            // Linked session date display
            const linkedOriginalDate = s.reposition_session_id
              ? linkedSessionDates[s.reposition_session_id]
              : null;
            const linkedDateLabel = linkedOriginalDate ? formatDatePT(linkedOriginalDate) : null;
            const repositaDateLabel = s.reposition_scheduled_at
              ? formatDatePT(s.reposition_scheduled_at)
              : null;

            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/terapeuta/pacientes/${s.patient_id}?aba=agenda`}
                        className="text-base font-semibold text-gray-900 hover:underline"
                      >
                        {s.patients?.full_name ?? "Paciente"}
                      </Link>
                      {s.is_recurring && (
                        <span title="Recorrente" className="text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {[time, s.clinics?.name, s.duration_minutes ? `${s.duration_minutes} min` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {s.patients?.insurance_name && (
                      <p className="text-xs text-gray-400 mt-0.5">{s.patients.insurance_name}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${statusClassName(state.status)}`}>
                    {statusBadge(state.status)}
                  </span>
                </div>

                {/* Vínculo de reposição */}
                {(linkedDateLabel || repositaDateLabel) && (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border"
                    style={{
                      backgroundColor: s.status === "makeup" || s.status === "makeup_completed" ? "#F5F3FF" : "#F7FAFC",
                      borderColor: s.status === "makeup" || s.status === "makeup_completed" ? "#DDD6FE" : "#E2E8F0",
                      color: s.status === "makeup" || s.status === "makeup_completed" ? "#6D28D9" : "#4A5568",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {linkedDateLabel && (
                      <span>Esta sessão é reposição de <strong>{linkedDateLabel}</strong></span>
                    )}
                    {repositaDateLabel && (
                      <span>Reposta em <strong>{repositaDateLabel}</strong></span>
                    )}
                  </div>
                )}

                {/* Status selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-500">Status</label>
                  <select
                    value={state.status}
                    onChange={(e) => updateCard(s.id, { status: e.target.value as SessionStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white"
                  >
                    {SESSION_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {needsNote && (
                    <textarea
                      rows={2}
                      placeholder="Observação sobre falta / cancelamento…"
                      value={state.absenceNote}
                      onChange={(e) => updateCard(s.id, { absenceNote: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white resize-none"
                    />
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button
                    onClick={() => saveStatus(s.id)}
                    disabled={state.saving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
                    style={{ backgroundColor: "#1a4a3a" }}
                  >
                    {state.saving ? "Salvando…" : "Salvar"}
                  </button>

                  <Link
                    href={`/terapeuta/pacientes/${s.patient_id}/sessoes/${s.id}`}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Ver sessão
                  </Link>

                  {showWhatsApp && (
                    <a
                      href={buildWhatsappLink(
                        guardian!.guardian_phone!,
                        s.patients?.full_name ?? "paciente",
                        dateLabel,
                        time
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.529 5.847L.057 23.428l5.729-1.504A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.052-1.398l-.361-.214-3.404.895.91-3.323-.235-.38A9.817 9.817 0 012.182 12C2.182 6.579 6.579 2.182 12 2.182S21.818 6.579 21.818 12 17.421 21.818 12 21.818z" />
                      </svg>
                      {state.status === "scheduled" ? "Aguardando confirmação" : "Enviar WhatsApp"}
                    </a>
                  )}
                </div>

                {state.saved && (
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Status atualizado!
                  </p>
                )}
                {state.erro && (
                  <p className="text-xs text-red-600">{state.erro}</p>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}

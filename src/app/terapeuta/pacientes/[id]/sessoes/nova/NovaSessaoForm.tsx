"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  SESSION_STATUS_OPTIONS,
  NEEDS_NOTES,
  LOST_STATUSES,
  statusBadge,
  statusClassName,
  type SessionStatus,
} from "@/lib/session-status";

type Clinica = { id: string; name: string };
type Props = { patientId: string; defaultValue: number | null; clinicas: Clinica[] };
type PerdidaSession = { id: string; scheduled_at: string; status: string; duration_minutes: number | null };

type Slot = { id: string; dayOfWeek: number; hour: number; minute: number };

const WEEKDAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const MINUTES = [
  { value: 0, label: "00" },
  { value: 30, label: "30" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function scheduledAt(dateISO: string, hour: number, minute: number): string {
  return `${dateISO}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function nextOccurrence(fromISO: string, targetDow: number): string {
  const d = new Date(fromISO + "T12:00:00");
  const diff = (targetDow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateWeekly(startISO: string, endISO: string, targetDow: number): string[] {
  const result: string[] = [];
  const first = new Date(nextOccurrence(startISO, targetDow) + "T12:00:00");
  const end = new Date(endISO + "T12:00:00");
  const current = new Date(first);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    result.push(`${y}-${m}-${day}`);
    current.setDate(current.getDate() + 7);
  }
  return result;
}

function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NovaSessaoForm({ patientId, defaultValue, clinicas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [slots, setSlots] = useState<Slot[]>([
    { id: crypto.randomUUID(), dayOfWeek: 1, hour: 9, minute: 0 },
  ]);
  const [specificDate, setSpecificDate] = useState("");
  const [specificHour, setSpecificHour] = useState(9);
  const [specificMinute, setSpecificMinute] = useState(0);
  const [isRepetir, setIsRepetir] = useState(false);
  const [showRetroModal, setShowRetroModal] = useState(false);

  const [clinicId, setClinicId] = useState(clinicas[0]?.id ?? "");
  const [duration, setDuration] = useState("30");
  const [status, setStatus] = useState<SessionStatus>("scheduled");
  const [valueBrl, setValueBrl] = useState(
    defaultValue != null ? String(defaultValue).replace(".", ",") : ""
  );
  const [absenceNotes, setAbsenceNotes] = useState("");
  const [repositionSessionId, setRepositionSessionId] = useState<string | null>(null);
  const [sessoesPerdidas, setSessoesPerdidas] = useState<PerdidaSession[]>([]);
  const [loadingPerdidas, setLoadingPerdidas] = useState(false);

  const showNotes = NEEDS_NOTES.includes(status);

  useEffect(() => {
    if (status !== "makeup") { setSessoesPerdidas([]); setRepositionSessionId(null); return; }
    let cancelled = false;
    async function fetchPerdidas() {
      setLoadingPerdidas(true);
      const supabase = createClient();
      const [lostRes, reposedRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("id, scheduled_at, status, duration_minutes")
          .eq("patient_id", patientId)
          .in("status", LOST_STATUSES as string[])
          .order("scheduled_at", { ascending: false })
          .limit(30),
        supabase
          .from("sessions")
          .select("reposition_session_id")
          .eq("patient_id", patientId)
          .not("reposition_session_id", "is", null),
      ]);
      if (cancelled) return;
      const reposedIds = new Set(
        (reposedRes.data ?? []).map((r: { reposition_session_id: string }) => r.reposition_session_id)
      );
      const available = (lostRes.data ?? []).filter((s: PerdidaSession) => !reposedIds.has(s.id));
      setSessoesPerdidas(available as PerdidaSession[]);
      setLoadingPerdidas(false);
    }
    fetchPerdidas();
    return () => { cancelled = true; };
  }, [status, patientId]);

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      { id: crypto.randomUUID(), dayOfWeek: 1, hour: 9, minute: 0 },
    ]);
  }

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSlot(id: string, field: keyof Omit<Slot, "id">, value: number) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  const endDate = addMonths(todayISO(), 6);

  function countPreview(): number {
    if (!isRepetir) return slots.length;
    const start = specificDate || todayISO();
    return slots.reduce(
      (acc, slot) => acc + generateWeekly(start, endDate, slot.dayOfWeek).length,
      0
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (status === "makeup" && !repositionSessionId) {
      setErro("Selecione a sessão que está sendo reposta.");
      return;
    }
    if (specificDate && specificDate < todayISO()) {
      setShowRetroModal(true);
      return;
    }
    doInsert();
  }

  async function doInsert() {
    setShowRetroModal(false);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErro("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!userData?.tenant_id) {
      setErro("tenant_id não encontrado.");
      setLoading(false);
      return;
    }

    const valueRaw = valueBrl.replace(",", ".").replace(/[^\d.]/g, "");
    const parsedValue = valueRaw ? parseFloat(valueRaw) : null;

    let count = 0;

    const base = {
      tenant_id: userData.tenant_id,
      patient_id: patientId,
      clinic_id: clinicId || null,
      duration_minutes: duration ? parseInt(duration, 10) : null,
      status,
      value_brl: parsedValue != null && !isNaN(parsedValue) ? parsedValue : null,
      absence_note: showNotes ? absenceNotes || null : null,
      reposition_session_id: status === "makeup" ? repositionSessionId : null,
    };

    if (isRepetir) {
      const recurrence_id = crypto.randomUUID();
      const start = specificDate || todayISO();
      const sessionsToInsert = slots.flatMap((slot) =>
        generateWeekly(start, endDate, slot.dayOfWeek).map((date) => ({
          ...base,
          scheduled_at: scheduledAt(date, slot.hour, slot.minute),
          is_recurring: true,
          recurrence_id,
        }))
      );
      if (sessionsToInsert.length === 0) {
        setErro("Nenhuma sessão gerada com os critérios informados.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.from("sessions").insert(sessionsToInsert);
      if (error) {
        setErro(`Erro ao salvar sessões: ${error.message}`);
        setLoading(false);
        return;
      }
      count = sessionsToInsert.length;
    } else {
      const sessionsToInsert = slots.map((slot) => {
        const date = specificDate || nextOccurrence(todayISO(), slot.dayOfWeek);
        const h = specificDate ? specificHour : slot.hour;
        const min = specificDate ? specificMinute : slot.minute;
        return {
          ...base,
          scheduled_at: scheduledAt(date, h, min),
          is_recurring: false,
        };
      });
      const { error } = await supabase.from("sessions").insert(sessionsToInsert);
      if (error) {
        setErro(`Erro ao salvar: ${error.message}`);
        setLoading(false);
        return;
      }
      count = sessionsToInsert.length;
    }

    setSuccessMsg(
      count === 1 ? "1 sessão cadastrada com sucesso!" : `${count} sessões cadastradas com sucesso!`
    );
    setLoading(false);
    setTimeout(() => {
      router.push(`/terapeuta/pacientes/${patientId}/sessoes`);
      router.refresh();
    }, 1500);
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectClass =
    "px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white";

  const preview = countPreview();

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Dias e horários */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
            Dias e horários
          </h2>

          <div className="space-y-3 mb-4">
            {slots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-2 flex-wrap">
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => updateSlot(slot.id, "dayOfWeek", Number(e.target.value))}
                  className={selectClass}
                >
                  {WEEKDAYS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
                <select
                  value={slot.hour}
                  onChange={(e) => updateSlot(slot.id, "hour", Number(e.target.value))}
                  className={selectClass}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                  ))}
                </select>
                <span className="text-gray-400 text-sm font-medium">:</span>
                <select
                  value={slot.minute}
                  onChange={(e) => updateSlot(slot.id, "minute", Number(e.target.value))}
                  className={selectClass}
                >
                  {MINUTES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSlot}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-[#1a4a3a] hover:text-[#1a4a3a] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar dia
          </button>

          <div className="mt-5 pt-5 border-t border-gray-50">
            <label className={labelClass}>
              Data específica
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                (opcional — para sessão avulsa ou retroativa)
              </span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className={`max-w-xs ${inputClass}`}
              />
              {specificDate && (
                <>
                  <select
                    value={specificHour}
                    onChange={(e) => setSpecificHour(Number(e.target.value))}
                    className={selectClass}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-sm font-medium">:</span>
                  <select
                    value={specificMinute}
                    onChange={(e) => setSpecificMinute(Number(e.target.value))}
                    className={selectClass}
                  >
                    {MINUTES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            {!specificDate && (
              <p className="mt-1.5 text-xs text-gray-400">
                Sem data específica: agendado para a próxima ocorrência de cada dia.
              </p>
            )}
          </div>
        </section>

        {/* Local e status */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
            Local e status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={labelClass}>Local (clínica)</label>
              {clinicas.length > 0 ? (
                <select
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sem local definido</option>
                  {clinicas.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-400 py-2">Nenhuma clínica cadastrada.</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Duração</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass}
              >
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status *</label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as SessionStatus)}
                className={inputClass}
              >
                {SESSION_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {showNotes && (
              <div className="sm:col-span-2">
                <label className={labelClass}>Observação sobre falta / cancelamento</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o motivo…"
                  value={absenceNotes}
                  onChange={(e) => setAbsenceNotes(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
            )}
            {status === "makeup" && (
              <div className="sm:col-span-2">
                <label className={labelClass}>Referente a qual sessão perdida? *</label>
                {loadingPerdidas ? (
                  <p className="text-sm text-gray-400 py-2">Carregando sessões perdidas…</p>
                ) : sessoesPerdidas.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-700">Nenhuma sessão pendente de reposição para este paciente.</p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-1">
                    {sessoesPerdidas.map((s) => {
                      const d = new Date(s.scheduled_at);
                      const dateStr = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()} às ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                            repositionSessionId === s.id
                              ? "border-[#1a4a3a] bg-[#e8f0ec]"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="reposition_session_id"
                            value={s.id}
                            checked={repositionSessionId === s.id}
                            onChange={() => setRepositionSessionId(s.id)}
                            className="accent-[#1a4a3a] flex-shrink-0"
                          />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusClassName(s.status)}`}>
                            {statusBadge(s.status)}
                          </span>
                          <span className="text-sm text-gray-700">
                            {dateStr}
                            {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Valor */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
            Valor financeiro
          </h2>
          <div className="max-w-xs">
            <label className={labelClass}>
              Valor da sessão (R$)
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                herdado do cadastro do paciente
              </span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={valueBrl}
              onChange={(e) => setValueBrl(e.target.value)}
              className={inputClass}
            />
          </div>
        </section>

        {/* Recorrência */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#1a4a3a" }}>
                Repetir toda semana
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {isRepetir
                  ? "Sessões semanais geradas por 6 meses"
                  : "Criar apenas as sessões acima"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRepetir((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                isRepetir ? "bg-[#1a4a3a]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={isRepetir}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  isRepetir ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {isRepetir && preview > 0 && (
            <div
              className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>{preview}</strong>{" "}
                {preview !== 1 ? "sessões serão criadas" : "sessão será criada"}
              </span>
            </div>
          )}
        </section>

        {successMsg && (
          <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            {successMsg}
          </p>
        )}

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {erro}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ backgroundColor: "#1a4a3a" }}
          >
            {loading
              ? "Salvando…"
              : isRepetir && preview > 1
              ? `Salvar ${preview} sessões`
              : "Salvar sessão"}
          </button>
        </div>
      </form>

      {/* Modal retroativo */}
      {showRetroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sessão retroativa</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Você está cadastrando uma sessão com data anterior a hoje. Tem certeza?
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRetroModal(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={doInsert}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

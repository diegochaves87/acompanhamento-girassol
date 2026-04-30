"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  SESSION_STATUS_OPTIONS,
  NEEDS_NOTES,
  type SessionStatus,
} from "@/lib/session-status";

type Clinica = { id: string; name: string };
type Props = { patientId: string; defaultValue: number | null; clinicas: Clinica[] };

type DayState = { enabled: boolean; time: string };

const WEEKDAYS = [
  { day: 1, label: "Seg" },
  { day: 2, label: "Ter" },
  { day: 3, label: "Qua" },
  { day: 4, label: "Qui" },
  { day: 5, label: "Sex" },
  { day: 6, label: "Sáb" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateDates(
  startISO: string,
  endISO: string,
  dayEntries: { day: number; time: string }[]
): { session_date: string; start_time: string | null }[] {
  const result: { session_date: string; start_time: string | null }[] = [];
  const dayMap = new Map(dayEntries.map((d) => [d.day, d.time]));
  const end = new Date(endISO + "T12:00:00");
  const current = new Date(startISO + "T12:00:00");
  while (current <= end) {
    const dow = current.getDay();
    if (dayMap.has(dow)) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      result.push({
        session_date: `${y}-${m}-${day}`,
        start_time: dayMap.get(dow) || null,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export default function NovaSessaoForm({ patientId, defaultValue, clinicas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    session_date: todayISO(),
    start_time: "",
    clinic_id: clinicas[0]?.id ?? "",
    duration_minutes: "50",
    status: "scheduled" as SessionStatus,
    value_brl: defaultValue != null ? String(defaultValue).replace(".", ",") : "",
    absence_notes: "",
  });

  const [isRecorrente, setIsRecorrente] = useState(false);
  const [noEndDate, setNoEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<Record<number, DayState>>({
    1: { enabled: false, time: "" },
    2: { enabled: false, time: "" },
    3: { enabled: false, time: "" },
    4: { enabled: false, time: "" },
    5: { enabled: false, time: "" },
    6: { enabled: false, time: "" },
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleDay(day: number) {
    setDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  }

  function setDayTime(day: number, time: string) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], time } }));
  }

  const showNotes = NEEDS_NOTES.includes(form.status);

  const selectedDayEntries = WEEKDAYS.filter((w) => days[w.day].enabled).map(
    (w) => ({ day: w.day, time: days[w.day].time })
  );

  const effectiveEndDate = noEndDate
    ? addMonths(form.session_date || todayISO(), 6)
    : endDate;

  const previewCount =
    isRecorrente && selectedDayEntries.length > 0 && form.session_date && effectiveEndDate
      ? generateDates(form.session_date, effectiveEndDate, selectedDayEntries).length
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (isRecorrente) {
      if (selectedDayEntries.length === 0) {
        setErro("Selecione pelo menos um dia da semana para a recorrência.");
        return;
      }
      if (!noEndDate && !endDate) {
        setErro("Informe a data de fim ou marque 'Sem data de fim'.");
        return;
      }
    }

    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErro("Usuário não autenticado."); setLoading(false); return; }

    const { data: userData } = await supabase
      .from("users").select("tenant_id").eq("id", user.id).maybeSingle();
    if (!userData?.tenant_id) { setErro("tenant_id não encontrado."); setLoading(false); return; }

    const valueRaw = form.value_brl.replace(",", ".").replace(/[^\d.]/g, "");
    const value_brl = valueRaw ? parseFloat(valueRaw) : null;
    const parsedValue = isNaN(value_brl as number) ? null : value_brl;

    const base = {
      tenant_id: userData.tenant_id,
      patient_id: patientId,
      clinic_id: form.clinic_id || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes, 10) : null,
      status: form.status,
      value_brl: parsedValue,
      absence_notes: showNotes ? form.absence_notes || null : null,
    };

    if (!isRecorrente) {
      const { error } = await supabase.from("sessions").insert({
        ...base,
        session_date: form.session_date,
        start_time: form.start_time || null,
        is_recurring: false,
      });
      if (error) { setErro(`Erro ao salvar: ${error.message}`); setLoading(false); return; }
    } else {
      const recurrence_id = crypto.randomUUID();
      const dates = generateDates(form.session_date, effectiveEndDate, selectedDayEntries);
      if (dates.length === 0) {
        setErro("Nenhuma sessão gerada com os critérios informados.");
        setLoading(false);
        return;
      }
      const sessionsToInsert = dates.map((d) => ({
        ...base,
        session_date: d.session_date,
        start_time: d.start_time,
        is_recurring: true,
        recurrence_id,
      }));
      const { error } = await supabase.from("sessions").insert(sessionsToInsert);
      if (error) { setErro(`Erro ao salvar sessões: ${error.message}`); setLoading(false); return; }
    }

    router.push(`/terapeuta/pacientes/${patientId}/sessoes`);
    router.refresh();
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Data e horário */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Data e horário
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              {isRecorrente ? "Data de início *" : "Data *"}
            </label>
            <input
              type="date"
              required
              value={form.session_date}
              onChange={(e) => set("session_date", e.target.value)}
              className={inputClass}
            />
          </div>
          {!isRecorrente && (
            <div>
              <label className={labelClass}>Horário</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Duração (minutos)</label>
            <input
              type="number"
              min="1"
              max="480"
              placeholder="50"
              value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", e.target.value)}
              className={inputClass}
            />
          </div>
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
                value={form.clinic_id}
                onChange={(e) => set("clinic_id", e.target.value)}
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
          <div className="sm:col-span-2">
            <label className={labelClass}>Status *</label>
            <select
              required
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
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
                value={form.absence_notes}
                onChange={(e) => set("absence_notes", e.target.value)}
                className={`${inputClass} resize-none`}
              />
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
            value={form.value_brl}
            onChange={(e) => set("value_brl", e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      {/* Recorrência */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold" style={{ color: "#1a4a3a" }}>
            Recorrência
          </h2>
          <button
            type="button"
            onClick={() => setIsRecorrente((v) => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              isRecorrente ? "bg-[#1a4a3a]" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={isRecorrente}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                isRecorrente ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          {isRecorrente ? "Gerar sessões automáticas nos dias selecionados" : "Tornar esta sessão recorrente"}
        </p>

        {isRecorrente && (
          <div className="space-y-6">
            {/* Dias da semana */}
            <div>
              <p className={labelClass}>Dias da semana e horários</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w.day}
                    className={`rounded-xl border p-3 transition-colors ${
                      days[w.day].enabled
                        ? "border-[#1a4a3a] bg-[#f0f4f1]"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={days[w.day].enabled}
                        onChange={() => toggleDay(w.day)}
                        className="w-4 h-4 rounded accent-[#1a4a3a]"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        {w.label}
                      </span>
                    </label>
                    <input
                      type="time"
                      disabled={!days[w.day].enabled}
                      value={days[w.day].time}
                      onChange={(e) => setDayTime(w.day, e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg border text-sm outline-none transition ${
                        days[w.day].enabled
                          ? "border-gray-200 bg-white focus:border-[#1a4a3a]"
                          : "border-gray-100 bg-gray-100 text-gray-300 cursor-not-allowed"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Período */}
            <div>
              <p className={labelClass}>Data de fim</p>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noEndDate}
                    onChange={(e) => setNoEndDate(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#1a4a3a]"
                  />
                  <span className="text-sm text-gray-700">
                    Sem data de fim{" "}
                    <span className="text-gray-400">(gerar 6 meses à frente)</span>
                  </span>
                </label>
                {!noEndDate && (
                  <input
                    type="date"
                    value={endDate}
                    min={form.session_date}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`max-w-xs ${inputClass}`}
                  />
                )}
              </div>
            </div>

            {/* Preview */}
            {previewCount > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>{previewCount}</strong> sessão{previewCount !== 1 ? "ões" : ""} será{previewCount !== 1 ? "ão" : ""} criada{previewCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

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
            : isRecorrente && previewCount > 0
            ? `Salvar ${previewCount} sessões`
            : "Salvar sessão"}
        </button>
      </div>
    </form>
  );
}

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

type Props = {
  patientId: string;
  defaultValue: number | null;
  clinicas: Clinica[];
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NovaSessaoForm({
  patientId,
  defaultValue,
  clinicas,
}: Props) {
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

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const showNotes = NEEDS_NOTES.includes(form.status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

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

    const valueRaw = form.value_brl.replace(",", ".").replace(/[^\d.]/g, "");
    const value_brl = valueRaw ? parseFloat(valueRaw) : null;

    const { error } = await supabase.from("sessions").insert({
      tenant_id: userData.tenant_id,
      patient_id: patientId,
      clinic_id: form.clinic_id || null,
      session_date: form.session_date,
      start_time: form.start_time || null,
      duration_minutes: form.duration_minutes
        ? parseInt(form.duration_minutes, 10)
        : null,
      status: form.status,
      value_brl: isNaN(value_brl as number) ? null : value_brl,
      absence_notes: showNotes ? form.absence_notes || null : null,
    });

    if (error) {
      setErro(`Erro ao salvar sessão: ${error.message}`);
      setLoading(false);
      return;
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
            <label className={labelClass}>Data *</label>
            <input
              type="date"
              required
              value={form.session_date}
              onChange={(e) => set("session_date", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Horário</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
              className={inputClass}
            />
          </div>
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
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-400 py-2">
                Nenhuma clínica cadastrada.
              </p>
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
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {showNotes && (
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Observação sobre falta / cancelamento
              </label>
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
          {loading ? "Salvando…" : "Salvar sessão"}
        </button>
      </div>
    </form>
  );
}

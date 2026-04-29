"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CONTRACT_OPTIONS = [
  { value: "autonomo_por_sessao", label: "Autônomo por sessão" },
  { value: "pj", label: "PJ" },
  { value: "clt", label: "CLT" },
];

export default function NovaClinicaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    contract_type: "autonomo_por_sessao",
    default_session_value_brl: "",
    payment_day: "",
    accepted_insurances: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: dbError } = await supabase.from("clinics").insert({
      name: form.name,
      address: form.address || null,
      city: form.city || null,
      phone: form.phone || null,
      contract_type: form.contract_type,
      default_session_value_brl: form.default_session_value_brl
        ? parseFloat(form.default_session_value_brl.replace(",", "."))
        : null,
      payment_day: form.payment_day ? parseInt(form.payment_day, 10) : null,
      accepted_insurances: form.accepted_insurances
        ? form.accepted_insurances.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      notes: form.notes || null,
    });

    if (dbError) {
      setError(`Erro ao salvar clínica: ${dbError.message}`);
      setLoading(false);
      return;
    }

    router.push("/terapeuta/clinicas");
    router.refresh();
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectClass = `${inputClass} bg-white`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Informações */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Informações da clínica
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nome *</label>
            <input
              type="text"
              required
              placeholder="Nome da clínica"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Endereço</label>
            <input
              type="text"
              placeholder="Rua, número, bairro"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Cidade</label>
            <input
              type="text"
              placeholder="Cidade"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Telefone</label>
            <input
              type="tel"
              placeholder="(00) 0000-0000"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Contrato */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Contrato
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Tipo de contrato</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
              {CONTRACT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("contract_type", opt.value)}
                  className="flex-1 py-2.5 transition-colors"
                  style={
                    form.contract_type === opt.value
                      ? { backgroundColor: "#1a4a3a", color: "#ffffff" }
                      : { backgroundColor: "#ffffff", color: "#6b7280" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Valor padrão por sessão (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={form.default_session_value_brl}
              onChange={(e) => set("default_session_value_brl", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Dia de pagamento</label>
            <select
              value={form.payment_day}
              onChange={(e) => set("payment_day", e.target.value)}
              className={selectClass}
            >
              <option value="">Selecione o dia</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Dia {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Convênios */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Convênios aceitos
        </h2>
        <label className={labelClass}>
          Convênios{" "}
          <span className="text-gray-400 font-normal">(separe por vírgula)</span>
        </label>
        <input
          type="text"
          placeholder="Ex: Unimed, Bradesco Saúde, Amil"
          value={form.accepted_insurances}
          onChange={(e) => set("accepted_insurances", e.target.value)}
          className={inputClass}
        />
      </section>

      {/* Observações */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Observações
        </h2>
        <textarea
          rows={4}
          placeholder="Informações adicionais sobre a clínica…"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-mono">
          {error}
        </p>
      )}

      {/* Ações */}
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
          {loading ? "Salvando…" : "Salvar clínica"}
        </button>
      </div>
    </form>
  );
}

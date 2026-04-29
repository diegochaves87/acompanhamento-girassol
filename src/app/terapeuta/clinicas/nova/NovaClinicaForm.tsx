"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CONTRACT_OPTIONS = [
  { value: "autonomo_por_sessao", label: "Autônomo" },
  { value: "pj", label: "PJ" },
  { value: "clt", label: "CLT" },
];

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

export default function NovaClinicaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    razao_social: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    contract_type: "autonomo_por_sessao",
    default_value_brl: "",
    payment_day: "",
    notes: "",
  });

  const [convenios, setConvenios] = useState<string[]>([]);
  const [convenioInput, setConvenioInput] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function formatCnpj(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function addConvenio() {
    const val = convenioInput.trim();
    if (val && !convenios.includes(val)) {
      setConvenios((prev) => [...prev, val]);
    }
    setConvenioInput("");
  }

  function handleConvenioKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addConvenio();
    }
    if (e.key === "Backspace" && convenioInput === "" && convenios.length > 0) {
      setConvenios((prev) => prev.slice(0, -1));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const tenant_id =
      user?.user_metadata?.tenant_id ?? user?.app_metadata?.tenant_id ?? null;

    if (!tenant_id) {
      setError("Não foi possível identificar o tenant do usuário. Faça login novamente.");
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from("clinics").insert({
      tenant_id,
      name: form.name,
      cnpj: form.cnpj.replace(/\D/g, "") || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      phone: form.phone || null,
      email: form.email || null,
      contract_type: form.contract_type,
      default_value_brl: form.default_value_brl
        ? parseFloat(form.default_value_brl.replace(",", "."))
        : null,
      payment_day: form.payment_day ? parseInt(form.payment_day, 10) : null,
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

      {/* Identificação */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Identificação
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Nome fantasia *{" "}
              <span className="text-gray-400 font-normal text-xs">(aparece nas listas do sistema)</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nome usado no sistema"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Razão social</label>
            <input
              type="text"
              placeholder="Razão social completa"
              value={form.razao_social}
              onChange={(e) => set("razao_social", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>CNPJ</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={(e) => set("cnpj", formatCnpj(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Localização */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Localização e contato
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            <label className={labelClass}>Estado</label>
            <select
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className={selectClass}
            >
              <option value="">Selecione</option>
              {ESTADOS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
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

          <div>
            <label className={labelClass}>E-mail</label>
            <input
              type="email"
              placeholder="contato@clinica.com.br"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
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
              value={form.default_value_brl}
              onChange={(e) => set("default_value_brl", e.target.value)}
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
                <option key={d} value={d}>Dia {d}</option>
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
          Digite e pressione{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-600 font-mono">Enter</kbd>
          {" "}ou{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-600 font-mono">,</kbd>
          {" "}para adicionar
        </label>
        <div
          className="flex flex-wrap gap-2 px-3 py-2.5 rounded-xl border border-gray-200 min-h-[46px] cursor-text transition focus-within:border-[#1a4a3a] focus-within:ring-2 focus-within:ring-[#1a4a3a]/10"
          onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
        >
          {convenios.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              {c}
              <button
                type="button"
                onClick={() => setConvenios((prev) => prev.filter((x) => x !== c))}
                className="hover:opacity-70 transition-opacity leading-none"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={convenioInput}
            onChange={(e) => setConvenioInput(e.target.value)}
            onKeyDown={handleConvenioKey}
            onBlur={addConvenio}
            placeholder={convenios.length === 0 ? "Ex: Unimed, Bradesco Saúde…" : ""}
            className="flex-1 min-w-[160px] text-sm outline-none placeholder-gray-400 bg-transparent py-0.5"
          />
        </div>
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

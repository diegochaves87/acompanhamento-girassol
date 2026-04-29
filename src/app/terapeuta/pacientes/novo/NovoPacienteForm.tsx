"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Clinica = { id: string; nome: string };

type Props = {
  clinicas: Clinica[];
};

const PARENTESCO_OPTIONS = ["Mãe", "Pai", "Avó", "Avô", "Tio(a)", "Irmão/Irmã", "Outro"];

export default function NovoPacienteForm({ clinicas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nome: "",
    data_nascimento: "",
    diagnostico: "",
    clinica: "",
    tipo_pagamento: "particular",
    valor_sessao: "",
    convenio: "",
    nome_responsavel: "",
    telefone_responsavel: "",
    email_responsavel: "",
    parentesco: "",
    observacoes: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const payload = {
      nome: form.nome,
      data_nascimento: form.data_nascimento || null,
      diagnostico: form.diagnostico || null,
      clinica: form.clinica || null,
      tipo_pagamento: form.tipo_pagamento,
      valor_sessao: form.valor_sessao ? parseFloat(form.valor_sessao.replace(",", ".")) : null,
      convenio: form.tipo_pagamento === "convenio" ? form.convenio || null : null,
      nome_responsavel: form.nome_responsavel || null,
      telefone_responsavel: form.telefone_responsavel || null,
      email_responsavel: form.email_responsavel || null,
      parentesco: form.parentesco || null,
      observacoes: form.observacoes || null,
    };

    const { error: dbError } = await supabase.from("patients").insert(payload);

    if (dbError) {
      setError("Erro ao salvar paciente. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/terapeuta/pacientes");
    router.refresh();
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectClass = `${inputClass} bg-white`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Dados do paciente */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Dados do paciente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nome completo *</label>
            <input
              type="text"
              required
              placeholder="Nome completo do paciente"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Data de nascimento</label>
            <input
              type="date"
              value={form.data_nascimento}
              onChange={(e) => set("data_nascimento", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Diagnóstico</label>
            <input
              type="text"
              placeholder="Ex: TEA, TDAH, Dislexia…"
              value={form.diagnostico}
              onChange={(e) => set("diagnostico", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Clínica</label>
            {clinicas.length > 0 ? (
              <select
                value={form.clinica}
                onChange={(e) => set("clinica", e.target.value)}
                className={selectClass}
              >
                <option value="">Selecione uma clínica</option>
                {clinicas.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Nome da clínica"
                value={form.clinica}
                onChange={(e) => set("clinica", e.target.value)}
                className={inputClass}
              />
            )}
          </div>
        </div>
      </section>

      {/* Pagamento */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Pagamento
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Tipo de pagamento</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
              {(["particular", "convenio"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => set("tipo_pagamento", tipo)}
                  className="flex-1 py-2.5 transition-colors"
                  style={
                    form.tipo_pagamento === tipo
                      ? { backgroundColor: "#1a4a3a", color: "#ffffff" }
                      : { backgroundColor: "#ffffff", color: "#6b7280" }
                  }
                >
                  {tipo === "particular" ? "Particular" : "Convênio"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Valor por sessão (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={form.valor_sessao}
              onChange={(e) => set("valor_sessao", e.target.value)}
              className={inputClass}
            />
          </div>

          {form.tipo_pagamento === "convenio" && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Convênio</label>
              <input
                type="text"
                placeholder="Nome do convênio"
                value={form.convenio}
                onChange={(e) => set("convenio", e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </section>

      {/* Responsável */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Responsável
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nome do responsável</label>
            <input
              type="text"
              placeholder="Nome completo do responsável"
              value={form.nome_responsavel}
              onChange={(e) => set("nome_responsavel", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Telefone</label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.telefone_responsavel}
              onChange={(e) => set("telefone_responsavel", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>E-mail do responsável</label>
            <input
              type="email"
              placeholder="email@exemplo.com"
              value={form.email_responsavel}
              onChange={(e) => set("email_responsavel", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Parentesco</label>
            <select
              value={form.parentesco}
              onChange={(e) => set("parentesco", e.target.value)}
              className={selectClass}
            >
              <option value="">Selecione</option>
              {PARENTESCO_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Observações */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>
          Observações
        </h2>
        <textarea
          rows={4}
          placeholder="Informações adicionais sobre o paciente…"
          value={form.observacoes}
          onChange={(e) => set("observacoes", e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
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
          {loading ? "Salvando…" : "Salvar paciente"}
        </button>
      </div>
    </form>
  );
}

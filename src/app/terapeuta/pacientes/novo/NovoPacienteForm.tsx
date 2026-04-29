"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Clinica = { id: string; name: string; accepted_insurances: string[] | null };

type Props = {
  clinicas: Clinica[];
};

const PARENTESCO_OPTIONS = ["Mãe", "Pai", "Avó", "Avô", "Tio(a)", "Irmão/Irmã", "Outro"];

export default function NovoPacienteForm({ clinicas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    birth_date: "",
    diagnosis: "",
    clinic_id: "",
    payment_type: "particular",
    value_per_session_brl: "",
    insurance_name: "",
    nome_responsavel: "",
    telefone_responsavel: "",
    email_responsavel: "",
    parentesco: "",
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Usuário não autenticado. Faça login novamente.");
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      setError(`Erro ao buscar tenant: ${userError.message}`);
      setLoading(false);
      return;
    }

    if (!userData?.tenant_id) {
      setError(`tenant_id não encontrado para o usuário ${user.id}. Verifique RLS na tabela users.`);
      setLoading(false);
      return;
    }

    // Insere paciente
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        tenant_id: userData.tenant_id,
        full_name: form.full_name,
        birth_date: form.birth_date || null,
        diagnosis: form.diagnosis
          ? form.diagnosis.split(",").map((d) => d.trim()).filter(Boolean)
          : [],
        clinic_id: form.clinic_id || null,
        payment_type: form.payment_type,
        value_per_session_brl: form.value_per_session_brl
          ? parseFloat(form.value_per_session_brl.replace(",", "."))
          : null,
        insurance_name:
          form.payment_type === "convenio" ? form.insurance_name || null : null,
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (patientError) {
      setError(`Erro ao salvar paciente: ${patientError.message}`);
      setLoading(false);
      return;
    }

    // Salva dados do responsável em family_patient sem criar usuário no Auth
    // O acesso ao app será configurado depois quando a Thaís quiser dar login ao responsável
    if (form.nome_responsavel.trim()) {
      const { error: linkError } = await supabase
        .from("family_patient")
        .insert({
          patient_id: patient.id,
          guardian_name: form.nome_responsavel,
          guardian_phone: form.telefone_responsavel || null,
          guardian_email: form.email_responsavel || null,
          guardian_relationship: form.parentesco || null,
        });

      if (linkError) {
        setError(`Paciente salvo, mas erro ao salvar dados do responsável: ${linkError.message}`);
        setLoading(false);
        return;
      }
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
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Data de nascimento</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => set("birth_date", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Diagnóstico</label>
            <input
              type="text"
              placeholder="Ex: TEA, TDAH, Dislexia (separe por vírgula)"
              value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Clínica</label>
            {clinicas.length > 0 ? (
              <select
                value={form.clinic_id}
                onChange={(e) => set("clinic_id", e.target.value)}
                className={selectClass}
              >
                <option value="">Selecione uma clínica</option>
                {clinicas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-400 py-2.5">
                Nenhuma clínica cadastrada ainda.
              </p>
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
                  onClick={() => set("payment_type", tipo)}
                  className="flex-1 py-2.5 transition-colors"
                  style={
                    form.payment_type === tipo
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
              value={form.value_per_session_brl}
              onChange={(e) => set("value_per_session_brl", e.target.value)}
              className={inputClass}
            />
          </div>

          {form.payment_type === "convenio" && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Convênio</label>
              {(() => {
                const seguros = clinicas.find(c => c.id === form.clinic_id)?.accepted_insurances ?? [];
                return seguros.length > 0 ? (
                  <select
                    value={form.insurance_name}
                    onChange={(e) => set("insurance_name", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Selecione o convênio</option>
                    {seguros.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={form.clinic_id ? "Nenhum convênio cadastrado nesta clínica" : "Selecione uma clínica primeiro"}
                    value={form.insurance_name}
                    onChange={(e) => set("insurance_name", e.target.value)}
                    className={inputClass}
                  />
                );
              })()}
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
          {loading ? "Salvando…" : "Salvar paciente"}
        </button>
      </div>
    </form>
  );
}

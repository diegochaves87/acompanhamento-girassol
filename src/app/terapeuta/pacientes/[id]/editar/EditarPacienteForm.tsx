"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Clinica = { id: string; name: string; accepted_insurances?: string[] };

type Patient = {
  id: string;
  full_name: string;
  cpf: string | null;
  birth_date: string | null;
  sexo: string | null;
  diagnosis: string[] | null;
  clinic_id: string | null;
  payment_type: string | null;
  value_per_session_brl: number | null;
  insurance_name: string | null;
  notes: string | null;
};

type Guardian = {
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  guardian_relationship: string | null;
} | null;

type Props = { patient: Patient; clinicas: Clinica[]; guardian: Guardian };

const PARENTESCO_OPTIONS = ["Mãe", "Pai", "Avó", "Avô", "Tio(a)", "Irmão/Irmã", "Outro"];

function formatCpf(digits: string) {
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export default function EditarPacienteForm({ patient, clinicas, guardian }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    full_name: patient.full_name,
    cpf: patient.cpf ? formatCpf(patient.cpf) : "",
    birth_date: patient.birth_date ?? "",
    sexo: patient.sexo ?? "nao_informado",
    diagnosis: patient.diagnosis?.join(", ") ?? "",
    clinic_id: patient.clinic_id ?? "",
    payment_type: patient.payment_type ?? "particular",
    value_per_session_brl: patient.value_per_session_brl?.toString().replace(".", ",") ?? "",
    insurance_name: patient.insurance_name ?? "",
    notes: patient.notes ?? "",
  });

  const [guardianForm, setGuardianForm] = useState({
    guardian_name: guardian?.guardian_name ?? "",
    guardian_phone: guardian?.guardian_phone ?? "",
    guardian_phone_alt: "",
    guardian_email: guardian?.guardian_email ?? "",
    guardian_relationship: guardian?.guardian_relationship ?? "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setG(field: string, value: string) {
    setGuardianForm((prev) => ({ ...prev, [field]: value }));
  }

  function applyCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    set("cpf", formatCpf(digits));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();
    const cpfDigits = form.cpf.replace(/\D/g, "");

    const { error: dbError } = await supabase
      .from("patients")
      .update({
        full_name: form.full_name,
        cpf: cpfDigits || null,
        birth_date: form.birth_date || null,
        sexo: form.sexo,
        diagnosis: form.diagnosis
          ? form.diagnosis.split(",").map((d) => d.trim()).filter(Boolean)
          : [],
        clinic_id: form.clinic_id || null,
        payment_type: form.payment_type,
        value_per_session_brl: form.value_per_session_brl
          ? parseFloat(form.value_per_session_brl.replace(",", "."))
          : null,
        insurance_name: form.payment_type === "convenio" ? form.insurance_name || null : null,
        notes: form.notes || null,
      })
      .eq("id", patient.id);

    if (dbError) {
      setError(`Erro ao salvar: ${dbError.message}`);
      setLoading(false);
      return;
    }

    // Save guardian — insert if new, update if existing
    const hasGuardianData =
      guardianForm.guardian_name.trim() ||
      guardianForm.guardian_phone.trim() ||
      guardianForm.guardian_email.trim();

    if (hasGuardianData) {
      const guardianPayload = {
        guardian_name: guardianForm.guardian_name || null,
        guardian_phone: guardianForm.guardian_phone || null,
        guardian_phone_alt: guardianForm.guardian_phone_alt || null,
        guardian_email: guardianForm.guardian_email || null,
        guardian_relationship: guardianForm.guardian_relationship || null,
      };

      if (guardian) {
        const { error: gErr } = await supabase
          .from("family_patient")
          .update(guardianPayload)
          .eq("patient_id", patient.id);
        if (gErr) {
          setError(`Erro ao salvar responsável: ${gErr.message}`);
          setLoading(false);
          return;
        }
      } else {
        const { error: gErr } = await supabase
          .from("family_patient")
          .insert({ patient_id: patient.id, ...guardianPayload });
        if (gErr) {
          setError(`Erro ao salvar responsável: ${gErr.message}`);
          setLoading(false);
          return;
        }
      }
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectClass = `${inputClass} bg-white`;

  const insuranceOptions = clinicas.find((c) => c.id === form.clinic_id)?.accepted_insurances ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Dados do paciente */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>Dados do paciente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nome completo *</label>
            <input type="text" required placeholder="Nome completo" value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>CPF</label>
            <input type="text" inputMode="numeric" placeholder="000.000.000-00" value={form.cpf}
              onChange={(e) => applyCpf(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Data de nascimento</label>
            <input type="date" value={form.birth_date}
              onChange={(e) => set("birth_date", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sexo</label>
            <select value={form.sexo} onChange={(e) => set("sexo", e.target.value)} className={selectClass}>
              <option value="nao_informado">Não informado</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Diagnóstico</label>
            <input type="text" placeholder="Ex: TEA, TDAH (separe por vírgula)" value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Clínica</label>
            {clinicas.length > 0 ? (
              <select value={form.clinic_id} onChange={(e) => set("clinic_id", e.target.value)} className={selectClass}>
                <option value="">Selecione uma clínica</option>
                {clinicas.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <p className="text-sm text-gray-400 py-2.5">Nenhuma clínica cadastrada ainda.</p>
            )}
          </div>
        </div>
      </section>

      {/* Pagamento */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>Pagamento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Tipo de pagamento</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
              {(["particular", "convenio"] as const).map((tipo) => (
                <button key={tipo} type="button" onClick={() => set("payment_type", tipo)}
                  className="flex-1 py-2.5 transition-colors"
                  style={form.payment_type === tipo
                    ? { backgroundColor: "#1a4a3a", color: "#ffffff" }
                    : { backgroundColor: "#ffffff", color: "#6b7280" }}>
                  {tipo === "particular" ? "Particular" : "Convênio"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Valor por sessão (R$)</label>
            <input type="text" inputMode="decimal" placeholder="0,00" value={form.value_per_session_brl}
              onChange={(e) => set("value_per_session_brl", e.target.value)} className={inputClass} />
          </div>
          {form.payment_type === "convenio" && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Convênio</label>
              {insuranceOptions.length > 0 ? (
                <select value={form.insurance_name} onChange={(e) => set("insurance_name", e.target.value)} className={selectClass}>
                  <option value="">Selecione o convênio</option>
                  {insuranceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Nome do convênio" value={form.insurance_name}
                  onChange={(e) => set("insurance_name", e.target.value)} className={inputClass} />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Responsável */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>Responsável</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nome do responsável</label>
            <input type="text" placeholder="Nome completo" value={guardianForm.guardian_name}
              onChange={(e) => setG("guardian_name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Parentesco</label>
            <select value={guardianForm.guardian_relationship} onChange={(e) => setG("guardian_relationship", e.target.value)} className={selectClass}>
              <option value="">Selecione</option>
              {PARENTESCO_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input type="tel" placeholder="(00) 00000-0000" value={guardianForm.guardian_phone}
              onChange={(e) => setG("guardian_phone", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefone alternativo</label>
            <input type="tel" placeholder="(00) 00000-0000" value={guardianForm.guardian_phone_alt}
              onChange={(e) => setG("guardian_phone_alt", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>E-mail do responsável</label>
            <input type="email" placeholder="email@exemplo.com" value={guardianForm.guardian_email}
              onChange={(e) => setG("guardian_email", e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Observações */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "#1a4a3a" }}>Observações</h2>
        <textarea rows={4} placeholder="Informações adicionais…" value={form.notes}
          onChange={(e) => set("notes", e.target.value)} className={`${inputClass} resize-none`} />
      </section>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-mono">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">Paciente atualizado com sucesso.</p>}

      <div className="flex items-center justify-end gap-3 pb-8">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
          style={{ backgroundColor: "#1a4a3a" }}>
          {loading ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

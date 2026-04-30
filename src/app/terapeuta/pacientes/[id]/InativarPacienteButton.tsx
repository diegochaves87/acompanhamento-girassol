"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = { patientId: string };

export default function InativarPacienteButton({ patientId }: Props) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleInativar() {
    if (!motivo.trim()) return;
    setLoading(true);
    setErro("");

    const supabase = createClient();
    const { error } = await supabase
      .from("patients")
      .update({ active: false, inactivation_reason: motivo.trim() })
      .eq("id", patientId);

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    router.push("/terapeuta/pacientes");
  }

  function fecharModal() {
    setModalAberto(false);
    setMotivo("");
    setErro("");
  }

  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors"
      >
        Inativar paciente
      </button>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Inativar paciente</h2>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                O paciente não aparecerá na lista principal, mas poderá ser reativado a qualquer momento.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Motivo da inativação <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Alta, pausou tratamento, transferência…"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 resize-none"
                />
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={fecharModal}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleInativar}
                disabled={loading || !motivo.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Inativando…" : "Confirmar"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

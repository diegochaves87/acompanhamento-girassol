"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  sessaoId: string;
  patientId: string;
};

export default function ExcluirSessaoButton({ sessaoId, patientId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleExcluir() {
    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase.from("sessions").delete().eq("id", sessaoId);
    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }
    router.push(`/terapeuta/pacientes/${patientId}/sessoes`);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          Esta sessão será excluída permanentemente. Esta ação não pode ser desfeita. Tem certeza?
        </p>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => { setConfirming(false); setErro(""); }}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExcluir}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Excluindo…" : "Confirmar exclusão"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
    >
      Excluir sessão
    </button>
  );
}

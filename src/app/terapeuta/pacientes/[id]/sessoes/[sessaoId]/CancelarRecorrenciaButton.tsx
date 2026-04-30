"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  recurrenceId: string;
  patientId: string;
  futurasCount: number;
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CancelarRecorrenciaButton({
  recurrenceId,
  patientId,
  futurasCount,
}: Props) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleCancelar() {
    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("recurrence_id", recurrenceId)
      .eq("status", "scheduled")
      .gte("session_date", todayISO());

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    router.push(`/terapeuta/pacientes/${patientId}/sessoes`);
    router.refresh();
  }

  if (confirmando) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          Isso cancelará{" "}
          <strong>{futurasCount}</strong>{" "}
          sessão{futurasCount !== 1 ? "ões" : ""} agendada{futurasCount !== 1 ? "s" : ""}{" "}
          desta recorrência. As sessões já realizadas são mantidas.
        </p>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => { setConfirmando(false); setErro(""); }}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={handleCancelar}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Cancelando…" : "Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
    >
      Cancelar recorrência
    </button>
  );
}

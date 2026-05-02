"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  sessaoId: string;
  recurrenceId: string;
  patientId: string;
  futurasCount: number;
  scheduledAt: string;
  sessionDateLabel: string;
};

type Action = "single" | "recurrence";

export default function CancelarRecorrenciaButton({
  sessaoId,
  recurrenceId,
  patientId,
  futurasCount,
  scheduledAt,
  sessionDateLabel,
}: Props) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleCancelarSessao() {
    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ status: "canceled_therapist" })
      .eq("id", sessaoId);

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    router.push(`/terapeuta/pacientes/${patientId}/sessoes`);
    router.refresh();
  }

  async function handleCancelarRecorrencia() {
    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("recurrence_id", recurrenceId)
      .eq("status", "scheduled")
      .gte("scheduled_at", scheduledAt);

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    router.push(`/terapeuta/pacientes/${patientId}/sessoes`);
    router.refresh();
  }

  if (action === "single") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          Esta sessão será cancelada. Tem certeza?
        </p>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => { setAction(null); setErro(""); }}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={handleCancelarSessao}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Cancelando…" : "Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  if (action === "recurrence") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          Todas as sessões futuras a partir de{" "}
          <strong>{sessionDateLabel}</strong>{" "}
          serão excluídas permanentemente. Esta ação não pode ser desfeita. Tem certeza?
        </p>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => { setAction(null); setErro(""); }}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={handleCancelarRecorrencia}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Excluindo…" : "Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setAction("single")}
        className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
      >
        Cancelar esta sessão
      </button>
      <button
        onClick={() => setAction("recurrence")}
        className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
      >
        Cancelar toda a recorrência ({futurasCount} sessões)
      </button>
    </div>
  );
}

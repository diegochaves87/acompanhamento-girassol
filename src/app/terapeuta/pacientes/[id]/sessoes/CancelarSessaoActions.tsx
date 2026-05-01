"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  sessaoId: string;
  isRecurring: boolean;
  recurrenceId: string | null;
};

export default function CancelarSessaoActions({ sessaoId, isRecurring, recurrenceId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function cancelarSessao() {
    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ status: "cancelled_therapist" })
      .eq("id", sessaoId);
    if (error) setErro(error.message);
    else router.refresh();
    setLoading(false);
  }

  async function cancelarRecorrencia() {
    if (!recurrenceId) return;
    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ status: "cancelled_therapist" })
      .eq("recurrence_id", recurrenceId)
      .eq("status", "scheduled");
    if (error) setErro(error.message);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      <button
        onClick={cancelarSessao}
        disabled={loading}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        Cancelar sessão
      </button>
      {isRecurring && recurrenceId && (
        <button
          onClick={cancelarRecorrencia}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
        >
          Cancelar recorrência
        </button>
      )}
      {erro && <span className="text-xs text-red-500">{erro}</span>}
    </div>
  );
}

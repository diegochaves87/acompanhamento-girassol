"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  sessaoId: string;
  isRecurring: boolean;
  recurrenceId: string | null;
  scheduledAt: string;
  sessionDateLabel: string;
};

type Modal = "single" | "recurrence" | null;

export default function CancelarSessaoActions({
  sessaoId,
  isRecurring,
  recurrenceId,
  scheduledAt,
  sessionDateLabel,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function cancelarSessao() {
    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ status: "canceled_therapist" })
      .eq("id", sessaoId);
    if (error) { setErro(error.message); setLoading(false); return; }
    setModal(null);
    router.refresh();
    setLoading(false);
  }

  async function cancelarRecorrencia() {
    if (!recurrenceId) return;
    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("recurrence_id", recurrenceId)
      .eq("status", "scheduled")
      .gte("scheduled_at", scheduledAt);
    if (error) { setErro(error.message); setLoading(false); return; }
    setModal(null);
    router.refresh();
    setLoading(false);
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <button
          onClick={() => setModal("single")}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          Cancelar sessão
        </button>
        {isRecurring && recurrenceId && (
          <button
            onClick={() => setModal("recurrence")}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
          >
            Cancelar recorrência
          </button>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {modal === "single"
                ? "Esta sessão será cancelada. Tem certeza?"
                : `Todas as sessões futuras a partir de ${sessionDateLabel} serão excluídas permanentemente. Esta ação não pode ser desfeita. Tem certeza?`}
            </p>
            {erro && <p className="text-xs text-red-600">{erro}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setModal(null); setErro(""); }}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={modal === "single" ? cancelarSessao : cancelarRecorrencia}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loading ? "…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DespublicarButton({ evolucaoId }: { evolucaoId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("evolutions").update({ status: "draft" }).eq("id", evolucaoId);
    router.refresh();
    setLoading(false);
    setShowModal(false);
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors"
      >
        Despublicar
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Tem certeza? Se continuar, a evolução será removida do acesso da família de forma permanente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-60"
              >
                {loading ? "…" : "Continuar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

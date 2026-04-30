"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Paciente = {
  id: string;
  full_name: string;
  diagnosis: string[] | null;
  inactivation_reason: string | null;
};

type Props = { inativos: Paciente[] };

export default function PacientesInativos({ inativos }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [reativando, setReativando] = useState<string | null>(null);

  async function handleReativar(id: string) {
    setReativando(id);
    const supabase = createClient();
    await supabase
      .from("patients")
      .update({ active: true, inactivation_reason: null })
      .eq("id", id);
    setReativando(null);
    router.refresh();
  }

  if (inativos.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 transition-transform duration-150 ${aberto ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Inativos ({inativos.length})
      </button>

      {aberto && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {inativos.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-6 py-4">
                <Link
                  href={`/terapeuta/pacientes/${p.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold bg-gray-100 text-gray-400">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-400 truncate">{p.full_name}</p>
                    <p className="text-sm text-gray-300 truncate">
                      {p.inactivation_reason ?? p.diagnosis?.join(", ") ?? "Sem diagnóstico"}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleReativar(p.id)}
                  disabled={reativando === p.id}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:border-[#1a4a3a] hover:text-[#1a4a3a] transition-colors disabled:opacity-40"
                >
                  {reativando === p.id ? "…" : "Reativar"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  conveniosUnicos: string[];
  pacientesUnicos: { id: string; full_name: string }[];
};

export default function AtendimentosFiltros({ conveniosUnicos, pacientesUnicos }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const [de, setDe] = useState(sp.get("de") ?? "");
  const [ate, setAte] = useState(sp.get("ate") ?? "");
  const [paciente, setPaciente] = useState(sp.get("paciente") ?? "");
  const [convenio, setConvenio] = useState(sp.get("convenio") ?? "");
  const [evolucao, setEvolucao] = useState(sp.get("evolucao") ?? "");

  function applyFilters() {
    const params = new URLSearchParams();
    if (de) params.set("de", de);
    if (ate) params.set("ate", ate);
    if (paciente) params.set("paciente", paciente);
    if (convenio) params.set("convenio", convenio);
    if (evolucao) params.set("evolucao", evolucao);
    startTransition(() => {
      router.push(`/terapeuta/agenda/atendimentos?${params.toString()}`);
    });
  }

  function clearFilters() {
    setDe(""); setAte(""); setPaciente(""); setConvenio(""); setEvolucao("");
    startTransition(() => {
      router.push("/terapeuta/agenda/atendimentos");
    });
  }

  const inputClass =
    "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white";

  const hasFilters = de || ate || paciente || convenio || evolucao;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Até</label>
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Paciente</label>
          <select value={paciente} onChange={(e) => setPaciente(e.target.value)} className={inputClass}>
            <option value="">Todos</option>
            {pacientesUnicos.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        {conveniosUnicos.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Convênio</label>
            <select value={convenio} onChange={(e) => setConvenio(e.target.value)} className={inputClass}>
              <option value="">Todos</option>
              {conveniosUnicos.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Evolução</label>
          <select value={evolucao} onChange={(e) => setEvolucao(e.target.value)} className={inputClass}>
            <option value="">Todos</option>
            <option value="sim">Com evolução</option>
            <option value="nao">Sem evolução</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={applyFilters}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#1a4a3a" }}
        >
          Filtrar
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

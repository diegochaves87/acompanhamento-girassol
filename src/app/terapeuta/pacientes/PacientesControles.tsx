"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PacientesInativos from "./PacientesInativos";
import ImportarExcelButton, { BaixarModeloButton } from "./ImportarExcelButton";

type Paciente = {
  id: string;
  full_name: string;
  birth_date: string | null;
  diagnosis: string[] | null;
  active: boolean | null;
  inactivation_reason: string | null;
  insurance_name: string | null;
};

type Props = {
  ativos: Paciente[];
  inativos: Paciente[];
  showAviso: boolean;
};

export default function PacientesControles({ ativos, inativos, showAviso }: Props) {
  const [busca, setBusca] = useState("");
  const [convenioFiltro, setConvenioFiltro] = useState("");

  const conveniosUnicos = useMemo(() => {
    const set = new Set<string>();
    for (const p of [...ativos, ...inativos]) {
      if (p.insurance_name?.trim()) set.add(p.insurance_name.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ativos, inativos]);

  function filtra<T extends { full_name: string; insurance_name: string | null }>(lista: T[]): T[] {
    return lista.filter((p) => {
      const matchBusca = p.full_name.toLowerCase().includes(busca.toLowerCase());
      const matchConvenio = !convenioFiltro || p.insurance_name?.trim() === convenioFiltro;
      return matchBusca && matchConvenio;
    });
  }

  const ativosFiltrados = filtra(ativos);
  const inativosFiltrados = filtra(inativos);
  const totalFiltrado = ativosFiltrados.length + inativosFiltrados.length;

  const inativosProp = inativosFiltrados.map(({ id, full_name, diagnosis, inactivation_reason }) => ({
    id,
    full_name,
    diagnosis,
    inactivation_reason,
  }));

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white";

  return (
    <div className="space-y-5">
      {/* Aviso sem email */}
      {showAviso && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Paciente salvo — responsável sem acesso ao app</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Nenhum e-mail foi informado para o responsável. O acesso ao app da família poderá ser configurado depois no perfil do paciente.
            </p>
          </div>
        </div>
      )}

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: totalFiltrado, color: "#1a4a3a", bg: "#e8f0ec" },
          { label: "Ativos", value: ativosFiltrados.length, color: "#166534", bg: "#dcfce7" },
          { label: "Inativos", value: inativosFiltrados.length, color: "#6b7280", bg: "#f3f4f6" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-xs font-medium text-gray-400 mb-0.5">{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Busca + filtro convênio */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
        {conveniosUnicos.length > 0 && (
          <select
            value={convenioFiltro}
            onChange={(e) => setConvenioFiltro(e.target.value)}
            className={`${inputClass} sm:w-52`}
          >
            <option value="">Todos os convênios</option>
            {conveniosUnicos.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Lista ativos */}
      {ativosFiltrados.length === 0 && inativosFiltrados.length === 0 ? (
        ativos.length === 0 && inativos.length === 0 ? (
          /* Estado vazio real */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 11-8 0 4 4 0 018 0zM3 8a4 4 0 118 0 4 4 0 01-8 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 mb-1">Nenhum paciente cadastrado</p>
            <p className="text-sm text-gray-400 mb-6">Adicione seu primeiro paciente ou importe uma planilha Excel.</p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <BaixarModeloButton variant="outline" />
              <ImportarExcelButton variant="outline" />
              <Link href="/terapeuta/pacientes/novo" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#1a4a3a" }}>
                Cadastrar paciente
              </Link>
            </div>
          </div>
        ) : (
          /* Sem resultados para o filtro */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-500">Nenhum paciente encontrado para os filtros aplicados.</p>
          </div>
        )
      ) : (
        ativosFiltrados.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {ativosFiltrados.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/terapeuta/pacientes/${p.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
                    >
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.full_name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {[p.insurance_name, p.diagnosis?.join(", ")]
                          .filter(Boolean)
                          .join(" · ") || "Sem diagnóstico cadastrado"}
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      {/* Lista inativos */}
      <PacientesInativos inativos={inativosProp} />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Paciente = { id: string; full_name: string };

export default function BuscaPaciente({ pacientes }: { pacientes: Paciente[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return pacientes;
    return pacientes.filter((p) => p.full_name.toLowerCase().includes(q));
  }, [busca, pacientes]);

  function highlight(name: string) {
    const q = busca.trim();
    if (!q) return <span>{name}</span>;
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <span>{name}</span>;
    return (
      <span>
        {name.slice(0, idx)}
        <mark className="bg-yellow-200 text-gray-900 rounded-sm px-0.5 not-italic">
          {name.slice(idx, idx + q.length)}
        </mark>
        {name.slice(idx + q.length)}
      </span>
    );
  }

  return (
    <div className="space-y-3">
      {/* Campo de busca */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome do paciente..."
          autoFocus
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 placeholder:text-gray-400"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Lista de resultados */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-12 flex flex-col items-center text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-600 mb-1">Nenhum paciente encontrado</p>
          <p className="text-sm text-gray-400">
            Tente um nome diferente{busca ? ` para "${busca}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-500">
              {filtrados.length === pacientes.length
                ? `${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""}`
                : `${filtrados.length} de ${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {filtrados.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/terapeuta/pacientes/${p.id}/sessoes/nova`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold select-none"
                    style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
                  >
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">
                    {highlight(p.full_name)}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-gray-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

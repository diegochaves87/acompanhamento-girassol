"use client";

import { useState } from "react";

type Props = { patientId: string };

const TIPOS = [
  { value: "evolucao", label: "Relatório de Evolução" },
  { value: "escolar", label: "Relatório Escolar" },
  { value: "laudo", label: "Laudo Clínico" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sixMonthsAgoISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RelatoriosTab({ patientId }: Props) {
  const [tipo, setTipo] = useState("evolucao");
  const [inicio, setInicio] = useState(sixMonthsAgoISO());
  const [fim, setFim] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  async function handleGerar() {
    setLoading(true);
    setTexto("");
    setError("");

    const res = await fetch("/api/relatorio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: patientId,
        tipo,
        periodo_inicio: inicio,
        periodo_fim: fim,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao gerar relatório.");
    } else {
      setTexto(json.texto ?? "");
    }
    setLoading(false);
  }

  function handleCopiar() {
    navigator.clipboard.writeText(texto);
  }

  function handleImprimir() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Relatório</title>
      <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;line-height:1.7;color:#222}h1{font-size:18px}pre{white-space:pre-wrap;font-family:inherit}</style>
      </head><body><pre>${texto.replace(/</g, "&lt;")}</pre></body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-600">Gerar relatório com IA</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-[#1a4a3a]"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Período — início</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Período — fim</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGerar}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#1a4a3a" }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Gerando…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Gerar com IA
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </div>
      )}

      {texto && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {TIPOS.find((t) => t.value === tipo)?.label}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopiar}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copiar
              </button>
              <button
                onClick={handleImprimir}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1a4a3a" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2m2 4h6a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2zm1-4h4v4H9v-4z" />
                </svg>
                Imprimir
              </button>
            </div>
          </div>
          <div className="px-6 py-5">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
              {texto}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

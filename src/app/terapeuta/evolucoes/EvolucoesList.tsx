"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import DespublicarButton from "./DespublicarButton";
import { deleteDraftEvolutions } from "./actions";

const PAGE_SIZE = 50;

type PendingItem = { sessionId: string; scheduledAt: string; patientName: string };
type EvoItem = {
  id: string;
  sessionId: string;
  patientName: string;
  scheduledAt: string;
  status: string;
  publishedToFamily: boolean;
};

type Props = {
  aba: string;
  sub: string;
  pendingItems: PendingItem[];
  evoItems: EvoItem[];
};

function formatDate(scheduledAt: string): string {
  if (!scheduledAt) return "—";
  const d = new Date(scheduledAt);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function applyFilters<T extends { patientName: string; scheduledAt: string }>(
  items: T[],
  nome: string,
  data: string,
  dataInicio: string,
  dataFim: string,
  mes: string
): T[] {
  return items.filter((item) => {
    if (nome && !item.patientName.toLowerCase().includes(nome.toLowerCase())) return false;
    const dateStr = item.scheduledAt ? item.scheduledAt.slice(0, 10) : "";
    if (data && dateStr !== data) return false;
    if (dataInicio && dateStr < dataInicio) return false;
    if (dataFim && dateStr > dataFim) return false;
    if (mes && (!dateStr || dateStr.slice(0, 7) !== mes)) return false;
    return true;
  });
}

function sortDesc<T extends { scheduledAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return tb - ta;
  });
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#e8f0ec" }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#1a4a3a" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="font-semibold text-gray-600 mb-1">Tudo em dia</p>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export default function EvolucoesList({ aba, sub, pendingItems, evoItems }: Props) {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [mes, setMes] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Reset to page 1 whenever filters or tab/sub change
  useEffect(() => { setPage(1); }, [aba, sub, nome, data, dataInicio, dataFim, mes]);

  const hasFilters = !!(nome || data || dataInicio || dataFim || mes);

  // Filter
  const filteredPending = applyFilters(pendingItems, nome, data, dataInicio, dataFim, mes);
  const filteredEvo = applyFilters(evoItems, nome, data, dataInicio, dataFim, mes);

  // Sub-filter publicadas
  const familiaItems = aba === "publicadas" ? filteredEvo.filter((e) => e.publishedToFamily) : [];
  const semItems = aba === "publicadas" ? filteredEvo.filter((e) => !e.publishedToFamily) : [];
  const displayedItems =
    aba === "publicadas" ? (sub === "sem" ? semItems : familiaItems) : filteredEvo;

  // Sort descending
  const sortedPending = sortDesc(filteredPending);
  const sortedDisplayed = sortDesc(displayedItems);

  // Pagination
  const totalItems = aba === "pendentes" ? sortedPending.length : sortedDisplayed.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPending = sortedPending.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pagedDisplayed = sortedDisplayed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Rascunhos: "select all" applies only to current page
  const allDraftIds = aba === "rascunhos" ? pagedDisplayed.map((e) => e.id) : [];
  const allSelected = allDraftIds.length > 0 && allDraftIds.every((id) => selectedIds.has(id));

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(allDraftIds));
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleDelete() {
    const count = selectedIds.size;
    if (!window.confirm(`Excluir ${count} rascunho${count > 1 ? "s" : ""}? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      await deleteDraftEvolutions(Array.from(selectedIds));
      setSelectedIds(new Set());
    });
  }

  return (
    <div className="space-y-3">

      {/* ── Filtros ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Buscar por paciente"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1a4a3a]"
          />
          <input
            type="date"
            value={data}
            title="Data específica"
            onChange={(e) => { setData(e.target.value); setDataInicio(""); setDataFim(""); setMes(""); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1a4a3a]"
          />
          <input
            type="month"
            value={mes}
            title="Mês"
            onChange={(e) => { setMes(e.target.value); setData(""); setDataInicio(""); setDataFim(""); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1a4a3a]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Intervalo:</span>
          <input
            type="date"
            value={dataInicio}
            title="Data início"
            onChange={(e) => { setDataInicio(e.target.value); setData(""); setMes(""); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1a4a3a]"
          />
          <span className="text-xs text-gray-400">até</span>
          <input
            type="date"
            value={dataFim}
            title="Data fim"
            onChange={(e) => { setDataFim(e.target.value); setData(""); setMes(""); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1a4a3a]"
          />
          {hasFilters && (
            <button
              onClick={() => { setNome(""); setData(""); setDataInicio(""); setDataFim(""); setMes(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors ml-1"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Sub-filtro publicadas ─────────────────────────────────────────────── */}
      {aba === "publicadas" && (
        <div className="flex gap-2">
          <a
            href="/terapeuta/evolucoes?aba=publicadas&sub=familia"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border"
            style={{
              backgroundColor: sub === "familia" ? "#1D3557" : "#fff",
              color: sub === "familia" ? "#fff" : "#6B7280",
              borderColor: sub === "familia" ? "#1D3557" : "#E5E7EB",
            }}
          >
            Para a família ({familiaItems.length})
          </a>
          <a
            href="/terapeuta/evolucoes?aba=publicadas&sub=sem"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border"
            style={{
              backgroundColor: sub === "sem" ? "#1D3557" : "#fff",
              color: sub === "sem" ? "#fff" : "#6B7280",
              borderColor: sub === "sem" ? "#1D3557" : "#E5E7EB",
            }}
          >
            Sem publicação ({semItems.length})
          </a>
        </div>
      )}

      {/* ── Toolbar rascunhos ─────────────────────────────────────────────────── */}
      {aba === "rascunhos" && pagedDisplayed.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-[#1a4a3a]"
            />
            Selecionar todos
          </label>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Excluir selecionados ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {/* ── Empty states ──────────────────────────────────────────────────────── */}
      {aba === "pendentes" && sortedPending.length === 0 && (
        <EmptyCard message={hasFilters ? "Nenhum resultado para o filtro aplicado." : "Nenhuma sessão realizada aguarda evolução."} />
      )}
      {aba === "rascunhos" && sortedDisplayed.length === 0 && (
        <EmptyCard message={hasFilters ? "Nenhum resultado para o filtro aplicado." : "Nenhum rascunho salvo."} />
      )}
      {aba === "publicadas" && sortedDisplayed.length === 0 && (
        <EmptyCard message={
          hasFilters ? "Nenhum resultado para o filtro aplicado." :
          sub === "sem" ? "Nenhuma evolução salva sem publicação para a família." :
          "Nenhuma evolução publicada para a família."
        } />
      )}

      {/* ── Lista pendentes ───────────────────────────────────────────────────── */}
      {aba === "pendentes" && pagedPending.map((item) => (
        <div key={item.sessionId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{item.patientName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.scheduledAt)}</p>
          </div>
          <Link
            href={`/terapeuta/evolucoes/nova?sessao=${item.sessionId}`}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Registrar
          </Link>
        </div>
      ))}

      {/* ── Lista rascunhos / publicadas ──────────────────────────────────────── */}
      {aba !== "pendentes" && pagedDisplayed.map((item) => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          {aba === "rascunhos" && (
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => toggleOne(item.id)}
              className="w-4 h-4 flex-shrink-0 rounded accent-[#1a4a3a]"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 truncate">{item.patientName}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                item.status === "published"
                  ? "bg-green-50 text-green-700 border-green-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                {item.status === "published" ? "PUBLICADA" : "RASCUNHO"}
              </span>
            </div>
            {item.scheduledAt && (
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.scheduledAt)}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.status === "published" && <DespublicarButton evolucaoId={item.id} />}
            <Link
              href={
                item.status === "published"
                  ? `/terapeuta/evolucoes/${item.id}`
                  : `/terapeuta/evolucoes/nova?sessao=${item.sessionId}&evolution=${item.id}`
              }
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {item.status === "draft" ? "Continuar" : "Ver"}
            </Link>
          </div>
        </div>
      ))}

      {/* ── Paginação ─────────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 pb-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-xs text-gray-500 text-center">
            Página {safePage} de {totalPages} · {totalItems} registros
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

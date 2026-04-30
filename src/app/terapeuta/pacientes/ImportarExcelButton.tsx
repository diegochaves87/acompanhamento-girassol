"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";

type Variant = "outline" | "ghost";
type Props = { variant?: Variant };

type PlanilhaRow = {
  nome_completo: string;
  data_nascimento: string;
  diagnostico: string;
  nome_responsavel: string;
  telefone_responsavel: string;
  email_responsavel: string;
  parentesco: string;
  clinica: string;
  tipo_pagamento: string;
  valor_sessao: string;
  convenio: string;
  cpf: string;
  observacoes: string;
  _linha: number;
};

type ResultadoItem = {
  linha: number;
  nome: string;
  status: "ok" | "erro";
  mensagem?: string;
};

type Stage = "idle" | "preview" | "importing" | "resultado";

function normHeader(h: string) {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const COLUMN_MAP: Record<string, keyof Omit<PlanilhaRow, "_linha">> = {
  "nome completo": "nome_completo",
  "nome": "nome_completo",
  "data de nascimento": "data_nascimento",
  "data nascimento": "data_nascimento",
  "nascimento": "data_nascimento",
  "diagnostico": "diagnostico",
  "diagnosticos": "diagnostico",
  "nome do responsavel": "nome_responsavel",
  "nome responsavel": "nome_responsavel",
  "responsavel": "nome_responsavel",
  "telefone do responsavel": "telefone_responsavel",
  "telefone responsavel": "telefone_responsavel",
  "telefone": "telefone_responsavel",
  "fone": "telefone_responsavel",
  "email do responsavel": "email_responsavel",
  "email responsavel": "email_responsavel",
  "email": "email_responsavel",
  "parentesco": "parentesco",
  "relacao": "parentesco",
  "clinica": "clinica",
  "clinica (nome fantasia)": "clinica",
  "nome da clinica": "clinica",
  "tipo de pagamento": "tipo_pagamento",
  "tipo pagamento": "tipo_pagamento",
  "pagamento": "tipo_pagamento",
  "valor por sessao": "valor_sessao",
  "valor sessao": "valor_sessao",
  "valor por sessao (r$)": "valor_sessao",
  "valor": "valor_sessao",
  "convenio": "convenio",
  "plano": "convenio",
  "cpf": "cpf",
  "observacoes": "observacoes",
  "observacao": "observacoes",
  "obs": "observacoes",
  "notas": "observacoes",
};

function parseDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "string") {
    const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  }
  return "";
}

// ─── Baixar Modelo ───────────────────────────────────────────────────────────

export function BaixarModeloButton({ variant = "ghost" }: Props) {
  const base =
    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80";

  return (
    <a
      href="/modelo-pacientes.xlsx"
      download="modelo-pacientes.xlsx"
      className={variant === "outline" ? `${base} border-2` : base}
      style={
        variant === "outline"
          ? { borderColor: "#1a4a3a", color: "#1a4a3a" }
          : { backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 16l5 5m0 0l5-5m-5 5V4"
        />
      </svg>
      Baixar modelo
    </a>
  );
}

// ─── Importar Excel ──────────────────────────────────────────────────────────

export default function ImportarExcelButton({ variant = "ghost" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [rows, setRows] = useState<PlanilhaRow[]>([]);
  const [resultado, setResultado] = useState<ResultadoItem[]>([]);
  const [erroLeitura, setErroLeitura] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setErroLeitura("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
          defval: "",
        });

        if (rawRows.length === 0) {
          setErroLeitura("Planilha vazia ou sem dados reconhecidos.");
          return;
        }

        const headers = Object.keys(rawRows[0]);
        const headerMap: Record<string, keyof Omit<PlanilhaRow, "_linha">> = {};
        headers.forEach((h) => {
          const norm = normHeader(h);
          if (COLUMN_MAP[norm]) headerMap[h] = COLUMN_MAP[norm];
        });

        const parsed = rawRows
          .map((raw, i): PlanilhaRow => {
            const row: PlanilhaRow = {
              nome_completo: "",
              data_nascimento: "",
              diagnostico: "",
              nome_responsavel: "",
              telefone_responsavel: "",
              email_responsavel: "",
              parentesco: "",
              clinica: "",
              tipo_pagamento: "",
              valor_sessao: "",
              convenio: "",
              cpf: "",
              observacoes: "",
              _linha: i + 2,
            };
            headers.forEach((h) => {
              const field = headerMap[h];
              if (!field) return;
              row[field] =
                field === "data_nascimento"
                  ? parseDate(raw[h])
                  : String(raw[h] ?? "").trim();
            });
            return row;
          })
          .filter((r) => r.nome_completo !== "");

        if (parsed.length === 0) {
          setErroLeitura(
            "Nenhum paciente encontrado. Verifique se a coluna 'Nome Completo' está preenchida."
          );
          return;
        }

        setRows(parsed);
        setStage("preview");
      } catch (err) {
        setErroLeitura(
          `Erro ao ler arquivo: ${err instanceof Error ? err.message : "desconhecido"}`
        );
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImportar() {
    setStage("importing");
    setErroLeitura("");
    try {
      const res = await fetch("/api/importar-pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      setResultado(json.results ?? []);
      setStage("resultado");
    } catch (err) {
      setErroLeitura(
        `Erro na importação: ${err instanceof Error ? err.message : "desconhecido"}`
      );
      setStage("preview");
    }
  }

  function handleFechar() {
    const foiResultado = stage === "resultado";
    setStage("idle");
    setRows([]);
    setResultado([]);
    setErroLeitura("");
    if (foiResultado) window.location.reload();
  }

  const base =
    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80";

  const okCount = resultado.filter((r) => r.status === "ok").length;
  const erroCount = resultado.filter((r) => r.status === "erro").length;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className={variant === "outline" ? `${base} border-2` : base}
        style={
          variant === "outline"
            ? { borderColor: "#1a4a3a", color: "#1a4a3a" }
            : { backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
          />
        </svg>
        Importar Excel
      </button>

      {/* Erro de leitura fora do modal */}
      {erroLeitura && stage === "idle" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm max-w-sm">
          <span>{erroLeitura}</span>
          <button
            onClick={() => setErroLeitura("")}
            className="opacity-70 hover:opacity-100 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Modal */}
      {stage !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Cabeçalho */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ backgroundColor: "#1a4a3a" }}
            >
              <h2 className="text-white font-semibold text-base">
                {stage === "preview" &&
                  `Prévia — ${rows.length} paciente${rows.length !== 1 ? "s" : ""} encontrado${rows.length !== 1 ? "s" : ""}`}
                {stage === "importing" && "Importando…"}
                {stage === "resultado" && "Resultado da importação"}
              </h2>
              <button
                onClick={handleFechar}
                className="text-white/70 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* ── Prévia ── */}
            {stage === "preview" && (
              <>
                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <th className="pb-2 pr-3 font-semibold">#</th>
                        <th className="pb-2 pr-3 font-semibold">Nome</th>
                        <th className="pb-2 pr-3 font-semibold">Nascimento</th>
                        <th className="pb-2 pr-3 font-semibold">Clínica</th>
                        <th className="pb-2 pr-3 font-semibold">Pagamento</th>
                        <th className="pb-2 font-semibold">Responsável</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r._linha}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="py-2 pr-3 text-gray-400 text-xs">{r._linha}</td>
                          <td className="py-2 pr-3 font-medium text-gray-800">{r.nome_completo}</td>
                          <td className="py-2 pr-3 text-gray-500">{r.data_nascimento || "—"}</td>
                          <td className="py-2 pr-3 text-gray-500">{r.clinica || "—"}</td>
                          <td className="py-2 pr-3 text-gray-500">
                            {r.tipo_pagamento.toLowerCase().includes("conv") ? "Convênio" : "Particular"}
                          </td>
                          <td className="py-2 text-gray-500">{r.nome_responsavel || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {erroLeitura && (
                  <p className="px-6 py-3 text-sm text-red-600 bg-red-50 border-t border-red-100 flex-shrink-0">
                    {erroLeitura}
                  </p>
                )}

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                  <button
                    onClick={handleFechar}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImportar}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#1a4a3a" }}
                  >
                    Importar {rows.length} paciente{rows.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </>
            )}

            {/* ── Importando ── */}
            {stage === "importing" && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                <div
                  className="w-9 h-9 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: "#1a4a3a", borderTopColor: "transparent" }}
                />
                <p className="text-sm text-gray-500">
                  Importando {rows.length} paciente{rows.length !== 1 ? "s" : ""}…
                </p>
              </div>
            )}

            {/* ── Resultado ── */}
            {stage === "resultado" && (
              <>
                <div className="flex-1 overflow-auto p-6 space-y-5">
                  {/* Resumo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-2xl p-5 text-center"
                      style={{ backgroundColor: "#e8f0ec" }}
                    >
                      <p className="text-4xl font-bold" style={{ color: "#1a4a3a" }}>
                        {okCount}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        importado{okCount !== 1 ? "s" : ""} com sucesso
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl p-5 text-center ${
                        erroCount > 0 ? "bg-red-50" : "bg-gray-50"
                      }`}
                    >
                      <p
                        className={`text-4xl font-bold ${
                          erroCount > 0 ? "text-red-600" : "text-gray-300"
                        }`}
                      >
                        {erroCount}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">com erro</p>
                    </div>
                  </div>

                  {/* Lista de erros */}
                  {erroCount > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Erros encontrados:
                      </p>
                      <ul className="space-y-1.5">
                        {resultado
                          .filter((r) => r.status === "erro")
                          .map((r, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm"
                            >
                              <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                              <span>
                                <span className="font-medium text-gray-800">{r.nome}</span>
                                <span className="text-gray-400 ml-1 text-xs">(linha {r.linha})</span>
                                {r.mensagem && (
                                  <span className="text-red-600 ml-1">— {r.mensagem}</span>
                                )}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0">
                  <button
                    onClick={handleFechar}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#1a4a3a" }}
                  >
                    Concluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

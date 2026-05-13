"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Relatorio = {
  id: string;
  titulo: string;
  conteudo: string;
  conteudo_humanizado: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  created_at: string;
};

type Props = {
  patientId: string;
  tenantId: string;
  patientName: string;
};

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

function formatPeriodo(inicio: string | null, fim: string | null): string | null {
  if (!inicio && !fim) return null;
  const fmt = (s: string) => new Date(s + "T00:00:00").toLocaleDateString("pt-BR");
  if (inicio && fim) return `${fmt(inicio)} — ${fmt(fim)}`;
  if (inicio) return `a partir de ${fmt(inicio)}`;
  return fim ? `até ${fmt(fim)}` : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function printReport(texto: string, titulo: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(
    `<html><head><title>${titulo}</title><style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;line-height:1.8;color:#1a1a1a;font-size:14px;padding:0 24px}div{white-space:pre-wrap}@media print{body{margin:20px;padding:0}}</style></head><body><div>${texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div></body></html>`
  );
  win.document.close();
  win.print();
}

const CONTENT_STYLE = {
  whiteSpace: "pre-wrap" as const,
  fontFamily: "Georgia, serif",
  fontSize: "14px",
  lineHeight: "1.8",
  color: "#1a1a1a",
};

function ErrorBanner({ msg, onClose }: { msg: string; onClose?: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
      </svg>
      <span className="flex-1">{msg}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function RelatoriosTab({ patientId, tenantId, patientName }: Props) {
  const [mode, setMode] = useState<"list" | "generate">("list");
  const [modal, setModal] = useState<"view" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Relatorio | null>(null);
  const [viewTab, setViewTab] = useState<"clinica" | "familia">("clinica");

  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [actionError, setActionError] = useState("");

  const [tipo, setTipo] = useState("evolucao");
  const [inicio, setInicio] = useState(sixMonthsAgoISO());
  const [fim, setFim] = useState(todayISO());
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [genError, setGenError] = useState("");

  const [saveTitle, setSaveTitle] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [humanizando, setHumanizando] = useState<string | null>(null);

  const fetchRelatorios = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("relatorios")
      .select("id, titulo, conteudo, conteudo_humanizado, periodo_inicio, periodo_fim, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    if (err) setListError(err.message);
    else setRelatorios(data ?? []);
    setLoading(false);
  }, [patientId]);

  useEffect(() => { fetchRelatorios(); }, [fetchRelatorios]);

  async function handleGerar() {
    setGenerating(true);
    setGeneratedText("");
    setGenError("");
    setSaveTitle("");
    const res = await fetch("/api/relatorio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, tipo, periodo_inicio: inicio, periodo_fim: fim }),
    });
    const json = await res.json();
    if (!res.ok) {
      setGenError(json.error ?? "Erro ao gerar relatório.");
    } else {
      setGeneratedText(json.texto ?? "");
      const now = new Date();
      const mes = now.toLocaleString("pt-BR", { month: "long" });
      setSaveTitle(`Relatório — ${patientName} — ${mes}/${now.getFullYear()}`);
    }
    setGenerating(false);
  }

  async function handleSaveNew() {
    if (!saveTitle.trim() || !generatedText) return;
    setSavingNew(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingNew(false); return; }
    const payload: Record<string, unknown> = {
      patient_id: patientId,
      author_id: user.id,
      titulo: saveTitle.trim(),
      conteudo: generatedText,
      periodo_inicio: inicio || null,
      periodo_fim: fim || null,
    };
    if (tenantId) payload.tenant_id = tenantId;
    const { error: err } = await supabase.from("relatorios").insert(payload);
    if (err) {
      setGenError(err.message);
    } else {
      setGeneratedText("");
      setSaveTitle("");
      setMode("list");
      await fetchRelatorios();
    }
    setSavingNew(false);
  }

  async function handleSaveEdit() {
    if (!selected) return;
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("relatorios")
      .update({ conteudo: editText, updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    if (err) {
      setActionError(err.message);
    } else {
      setRelatorios(prev => prev.map(r => r.id === selected.id ? { ...r, conteudo: editText } : r));
      setModal(null);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("relatorios").delete().eq("id", selected.id);
    setRelatorios(prev => prev.filter(r => r.id !== selected.id));
    setModal(null);
    setSelected(null);
    setDeleting(false);
  }

  async function handleHumanizar(relatorio: Relatorio) {
    setHumanizando(relatorio.id);
    setActionError("");

    const supabase = createClient();

    const { data: familiarPortal } = await supabase
      .from("family_access")
      .select("nome, relacao")
      .eq("patient_id", patientId)
      .not("status", "eq", "pendente")
      .maybeSingle();

    const { data: guardian } = await supabase
      .from("family_patient")
      .select("guardian_name, guardian_relationship")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const familiar_nome = (familiarPortal as { nome?: string } | null)?.nome || (guardian as { guardian_name?: string } | null)?.guardian_name || "família";
    const familiar_parentesco = (familiarPortal as { relacao?: string } | null)?.relacao || (guardian as { guardian_relationship?: string } | null)?.guardian_relationship || "responsável";
    console.log("familiar encontrado:", familiar_nome, familiar_parentesco);

    const res = await fetch("/api/relatorio/humanizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo: relatorio.conteudo, familiar_nome, familiar_parentesco }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "Erro ao gerar versão família.");
    } else {
      const humanizado: string = json.texto ?? "";
      await supabase
        .from("relatorios")
        .update({ conteudo_humanizado: humanizado, updated_at: new Date().toISOString() })
        .eq("id", relatorio.id);
      setRelatorios(prev =>
        prev.map(r => r.id === relatorio.id ? { ...r, conteudo_humanizado: humanizado } : r)
      );
      if (selected?.id === relatorio.id) {
        setSelected(prev => prev ? { ...prev, conteudo_humanizado: humanizado } : null);
        setViewTab("familia");
      }
    }
    setHumanizando(null);
  }

  function openView(r: Relatorio, tab: "clinica" | "familia" = "clinica") {
    setSelected(r);
    setViewTab(tab);
    setModal("view");
  }

  function openEdit(r: Relatorio) {
    setSelected(r);
    setEditText(r.conteudo);
    setModal("edit");
  }

  function openDelete(r: Relatorio) {
    setSelected(r);
    setModal("delete");
  }

  const activeViewText = viewTab === "clinica" ? selected?.conteudo : selected?.conteudo_humanizado;

  return (
    <div className="space-y-4">

      {/* ── LIST MODE ── */}
      {mode === "list" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {loading ? "Carregando…" : `${relatorios.length} relatório${relatorios.length !== 1 ? "s" : ""}`}
            </p>
            <button
              onClick={() => { setMode("generate"); setGeneratedText(""); setGenError(""); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#1a4a3a" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Gerar novo relatório
            </button>
          </div>

          {listError && <ErrorBanner msg={listError} />}
          {actionError && <ErrorBanner msg={actionError} onClose={() => setActionError("")} />}

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 flex justify-center">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1a4a3a] rounded-full animate-spin" />
            </div>
          ) : relatorios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-16 text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#e8f0ec" }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#1a4a3a" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-600 mb-1">Nenhum relatório salvo</p>
              <p className="text-sm text-gray-400">Gere e salve relatórios clínicos com IA.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relatorios.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-snug">{r.titulo}</p>
                      {formatPeriodo(r.periodo_inicio, r.periodo_fim) && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatPeriodo(r.periodo_inicio, r.periodo_fim)}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.created_at)}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        Clínico
                      </span>
                      {r.conteudo_humanizado && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          Família
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => openView(r)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Visualizar
                    </button>

                    <button
                      onClick={() => openEdit(r)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>

                    {r.conteudo_humanizado ? (
                      <button
                        onClick={() => openView(r, "familia")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                        Ver versão família
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHumanizar(r)}
                        disabled={humanizando === r.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-100 disabled:opacity-50"
                      >
                        {humanizando === r.id ? (
                          <div className="w-3.5 h-3.5 border border-purple-400 border-t-purple-700 rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        )}
                        {humanizando === r.id ? "Gerando…" : "Gerar versão família"}
                      </button>
                    )}

                    <button
                      onClick={() => openDelete(r)}
                      className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                      </svg>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── GENERATE MODE ── */}
      {mode === "generate" && (
        <>
          <button
            onClick={() => { setMode("list"); setGeneratedText(""); setGenError(""); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para relatórios
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-600">Gerar relatório com IA</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-[#1a4a3a]"
                >
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Período — início</label>
                <input type="date" value={inicio} onChange={e => setInicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Período — fim</label>
                <input type="date" value={fim} onChange={e => setFim(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a]" />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleGerar}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#1a4a3a" }}
              >
                {generating ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Gerando…</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    Gerar com IA</>
                )}
              </button>
            </div>
          </div>

          {genError && <ErrorBanner msg={genError} />}

          {generatedText && (
            <>
              <div className="rounded-2xl border border-amber-200 p-5 space-y-3" style={{ backgroundColor: "#FFFBEB" }}>
                <p className="text-sm font-semibold text-amber-900">Salvar este relatório</p>
                <div>
                  <label className="block text-xs font-medium text-amber-800 mb-1">Título</label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={e => setSaveTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 text-sm text-gray-900 outline-none focus:border-amber-400 bg-white"
                    placeholder="Título do relatório"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNew}
                    disabled={savingNew || !saveTitle.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: "#1a4a3a" }}
                  >
                    {savingNew ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando…</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Salvar relatório</>
                    )}
                  </button>
                  <button
                    onClick={() => { setGeneratedText(""); setSaveTitle(""); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prévia</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copiar
                    </button>
                    <button
                      onClick={() => printReport(generatedText, saveTitle || "Relatório")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90"
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
                  <div style={CONTENT_STYLE}>{generatedText}</div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── VIEW MODAL ── */}
      {modal === "view" && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="min-w-0 pr-4">
                <p className="font-semibold text-gray-800 leading-snug">{selected.titulo}</p>
                {formatPeriodo(selected.periodo_inicio, selected.periodo_fim) && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatPeriodo(selected.periodo_inicio, selected.periodo_fim)}</p>
                )}
              </div>
              <button onClick={() => setModal(null)} className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selected.conteudo_humanizado && (
              <div className="flex border-b border-gray-100 flex-shrink-0">
                {(["clinica", "familia"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setViewTab(tab)}
                    className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                      viewTab === tab ? "text-[#1a4a3a] border-[#1a4a3a]" : "text-gray-400 border-transparent hover:text-gray-600"
                    }`}
                  >
                    {tab === "clinica" ? "Versão Clínica" : "Versão Família"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div style={CONTENT_STYLE}>{activeViewText}</div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => openEdit(selected)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(activeViewText ?? "")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copiar
                </button>
                <button
                  onClick={() => printReport(activeViewText ?? "", selected.titulo)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90"
                  style={{ backgroundColor: "#1a4a3a" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2m2 4h6a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2zm1-4h4v4H9v-4z" />
                  </svg>
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {modal === "edit" && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <p className="font-semibold text-gray-800">Editar relatório</p>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {actionError && <ErrorBanner msg={actionError} onClose={() => setActionError("")} />}
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a] resize-none p-4"
                style={{ fontFamily: "Georgia, serif", fontSize: "14px", lineHeight: "1.8", minHeight: "400px" }}
              />
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#1a4a3a" }}
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando…</>
                ) : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {modal === "delete" && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
              </svg>
            </div>
            <p className="font-semibold text-gray-800 mb-1">Excluir relatório?</p>
            <p className="text-sm text-gray-500 mb-5">&ldquo;{selected.titulo}&rdquo; será excluído permanentemente.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#DC2626" }}
              >
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

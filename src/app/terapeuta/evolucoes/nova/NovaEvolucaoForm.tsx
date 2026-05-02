"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Props = {
  sessionId: string;
  patientId: string;
  tenantId: string;
  patientName: string;
  sessionDate: string;
  clinicName: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  existingEvolutionId?: string;
  existingTechnicalText?: string;
  existingFamilyText?: string;
};

type UploadState = { status: "idle" | "loading" | "done" | "error"; message: string };
type SaveState = { saving: boolean; message: string; type: "success" | "error" | "idle" };

export default function NovaEvolucaoForm({
  sessionId,
  patientId,
  tenantId,
  patientName,
  sessionDate,
  clinicName,
  guardianName,
  guardianRelationship,
  existingEvolutionId,
  existingTechnicalText,
  existingFamilyText,
}: Props) {
  const [evolucaoId, setEvolucaoId] = useState<string | null>(existingEvolutionId ?? null);
  const [technicalText, setTechnicalText] = useState(existingTechnicalText ?? "");
  const [familyText, setFamilyText] = useState(existingFamilyText ?? "");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle", message: "" });
  const [saveState, setSaveState] = useState<SaveState>({ saving: false, message: "", type: "idle" });
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (ext === "txt") {
      setUploadState({ status: "loading", message: "Lendo arquivo..." });
      try {
        const text = await file.text();
        setTechnicalText(text);
        setUploadState({ status: "done", message: "Arquivo carregado com sucesso." });
      } catch {
        setUploadState({ status: "error", message: "Erro ao ler o arquivo." });
      }
    } else if (ext === "pdf") {
      setUploadState({ status: "loading", message: "Extraindo texto do PDF via IA..." });
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const res = await fetch("/api/evolucoes/extrair", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64, mimeType: "application/pdf" }),
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error ?? "Falha na extração");
          setTechnicalText(data.text ?? "");
          setUploadState({ status: "done", message: "Texto extraído do PDF." });
        } catch (err: unknown) {
          setUploadState({
            status: "error",
            message: err instanceof Error ? err.message : "Erro ao processar PDF.",
          });
        }
      };
      reader.onerror = () =>
        setUploadState({ status: "error", message: "Erro ao ler o arquivo." });
      reader.readAsDataURL(file);
    } else if (ext === "docx") {
      setUploadState({ status: "loading", message: "Extraindo texto do Word..." });
      try {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTechnicalText(result.value);
        setUploadState({ status: "done", message: "Texto extraído do Word." });
      } catch {
        setUploadState({ status: "error", message: "Erro ao ler o arquivo .docx." });
      }
    } else {
      setUploadState({ status: "error", message: "Formato não suportado. Use .txt, .pdf ou .docx." });
    }
  }

  async function handleGenerate() {
    if (!technicalText.trim()) return;
    setGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/evolucoes/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicalText,
          patientName,
          guardianName,
          guardianRelationship,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro ao gerar");
      setFamilyText(data.familyText ?? "");
    } catch (err: unknown) {
      setGenerateError(
        err instanceof Error ? err.message : "Erro ao gerar versão para a família."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(status: "draft" | "published") {
    setSaveState({ saving: true, message: "", type: "idle" });
    setPendingCount(null);
    const supabase = createClient();
    const payload = {
      technical_text: technicalText || null,
      family_text: familyText || null,
      status,
      updated_at: new Date().toISOString(),
    };

    let saveError: { message: string } | null = null;
    let savedId = evolucaoId;

    if (evolucaoId) {
      const { error } = await supabase.from("evolutions").update(payload).eq("id", evolucaoId);
      saveError = error;
    } else {
      const { data, error } = await supabase
        .from("evolutions")
        .insert({ ...payload, session_id: sessionId, patient_id: patientId, tenant_id: tenantId })
        .select("id")
        .single();
      saveError = error;
      if (!error && data) savedId = data.id;
    }

    if (saveError) {
      setSaveState({ saving: false, message: saveError.message, type: "error" });
    } else {
      if (savedId && savedId !== evolucaoId) setEvolucaoId(savedId);
      setSaveState({
        saving: false,
        message: status === "draft" ? "Rascunho salvo." : "Evolução publicada para a família.",
        type: "success",
      });
      if (status === "published") {
        const [completedRes, evolvedRes] = await Promise.all([
          supabase.from("sessions").select("id").eq("tenant_id", tenantId).eq("status", "completed"),
          supabase.from("evolutions").select("session_id").eq("tenant_id", tenantId),
        ]);
        const evolvedIds = new Set((evolvedRes.data ?? []).map((e: { session_id: string }) => e.session_id));
        const count = (completedRes.data ?? []).filter((s: { id: string }) => !evolvedIds.has(s.id)).length;
        setPendingCount(count);
      }
    }
  }

  const guardianDesc =
    [guardianRelationship, guardianName].filter(Boolean).join(" ") || "responsável";

  return (
    <div className="space-y-4">
      {/* Cabeçalho da sessão */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#e8f0ec" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#1a4a3a"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 leading-tight">{patientName}</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {[sessionDate, clinicName].filter(Boolean).join(" · ")}
          </p>
          {(guardianRelationship || guardianName) && (
            <p className="text-xs text-gray-400 mt-0.5">Responsável: {guardianDesc}</p>
          )}
        </div>
      </div>

      {/* Texto técnico */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-semibold text-gray-700">Texto técnico</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Subir arquivo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {uploadState.status !== "idle" && (
          <p
            className={`text-xs font-medium ${
              uploadState.status === "error"
                ? "text-red-600"
                : uploadState.status === "done"
                ? "text-green-700"
                : "text-gray-500"
            }`}
          >
            {uploadState.status === "loading" && (
              <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1.5 align-middle" />
            )}
            {uploadState.message}
          </p>
        )}

        <textarea
          value={technicalText}
          onChange={(e) => setTechnicalText(e.target.value)}
          placeholder="Digite ou cole aqui o texto técnico da evolução. Também é possível subir um arquivo .txt ou .pdf."
          rows={10}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white resize-y leading-relaxed"
        />
      </div>

      {/* Geração IA — só aparece quando há texto técnico */}
      {technicalText.trim() && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Versão para a família</p>
              <p className="text-xs text-gray-400 mt-0.5">
                IA humaniza o texto e adiciona dicas práticas para o dia a dia
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: "#1a4a3a" }}
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Gerando...
                </>
              ) : (
                <>
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {familyText ? "Regerar" : "Gerar versão para a família"}
                </>
              )}
            </button>
          </div>

          {generateError && <p className="text-xs text-red-600">{generateError}</p>}

          {familyText && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">
                Revise e edite antes de publicar
              </label>
              <textarea
                value={familyText}
                onChange={(e) => setFamilyText(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10 bg-white resize-y leading-relaxed"
              />
            </div>
          )}
        </div>
      )}

      {/* Botões de ação */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saveState.saving || !familyText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Publicar para a família
          </button>

          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saveState.saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Salvar rascunho
          </button>
        </div>

        {saveState.message && (
          <p
            className={`text-xs font-medium mt-3 flex items-center gap-1 ${
              saveState.type === "error" ? "text-red-600" : "text-green-700"
            }`}
          >
            {saveState.type === "success" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {saveState.message}
          </p>
        )}

        {pendingCount !== null && pendingCount > 0 && (
          <Link
            href="/terapeuta/agenda/atendimentos"
            className="mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-amber-800">
                Você ainda tem {pendingCount} {pendingCount === 1 ? "evolução pendente" : "evoluções pendentes"}
              </span>
            </div>
            <span className="text-xs font-bold text-amber-700 whitespace-nowrap">Continuar →</span>
          </Link>
        )}

        {pendingCount === 0 && (
          <p className="mt-3 text-xs font-medium text-green-700 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Todas as evoluções em dia!
          </p>
        )}
      </div>
    </div>
  );
}

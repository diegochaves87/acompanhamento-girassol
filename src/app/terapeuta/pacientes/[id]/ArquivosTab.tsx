"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Arquivo = {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimetype: string) {
  if (mimetype.startsWith("image/"))
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (mimetype === "application/pdf")
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ArquivosTab({ patientId }: { patientId: string }) {
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prefix = `${patientId}/`;

  const fetchArquivos = useCallback(async () => {
    const supabase = createClient();
    const { data, error: listErr } = await supabase.storage
      .from("documentos")
      .list(patientId, { sortBy: { column: "created_at", order: "desc" } });
    if (listErr) {
      setError(listErr.message);
    } else {
      setArquivos(
        ((data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder") as Arquivo[])
      );
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => { fetchArquivos(); }, [fetchArquivos]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setError("");
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${prefix}${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from("documentos").upload(filePath, file);
    if (upErr) setError(upErr.message);
    else await fetchArquivos();
    setUploading(false);
  }

  async function handleDelete(fileName: string, fileId: string) {
    setDeletingId(fileId);
    const supabase = createClient();
    await supabase.storage.from("documentos").remove([`${prefix}${fileName}`]);
    setArquivos((prev) => prev.filter((f) => f.id !== fileId));
    setDeletingId(null);
  }

  function getPublicUrl(fileName: string) {
    const supabase = createClient();
    const { data } = supabase.storage
      .from("documentos")
      .getPublicUrl(`${prefix}${fileName}`);
    return data.publicUrl;
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
        onChange={handleUpload}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">
            {loading ? "Carregando…" : `${arquivos.length} arquivo${arquivos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#1a4a3a" }}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Enviar arquivo
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 text-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1a4a3a] rounded-full animate-spin mx-auto" />
        </div>
      ) : arquivos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-600 mb-1">Nenhum arquivo enviado</p>
          <p className="text-sm text-gray-400">Envie laudos, relatórios, imagens e outros documentos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-50">
            {arquivos.map((f) => {
              const mime = f.metadata?.mimetype ?? "";
              const size = f.metadata?.size ?? 0;
              const displayName = f.name.replace(/^\d+_/, "").replace(/_/g, " ");
              const url = getPublicUrl(f.name);
              return (
                <li key={f.id} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
                  >
                    {fileIcon(mime)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {size ? formatBytes(size) : ""}{" "}
                      {f.created_at
                        ? `· ${new Date(f.created_at).toLocaleDateString("pt-BR")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-gray-400 hover:text-[#1a4a3a] hover:bg-gray-50 transition-colors"
                      title="Abrir"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <button
                      onClick={() => handleDelete(f.name, f.id)}
                      disabled={deletingId === f.id}
                      className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

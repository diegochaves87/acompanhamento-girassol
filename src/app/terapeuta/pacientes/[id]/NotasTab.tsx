"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Note = {
  id: string;
  technical_note: string;
  created_at: string;
  profiles?: { full_name: string } | null;
};

type Props = {
  patientId: string;
  tenantId: string;
  initialNotes: Note[];
};

function formatNoteDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotasTab({ patientId, tenantId, initialNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, tenant_id: tenantId, technical_note: content.trim() }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar nota.");
    } else {
      setNotes((prev) => [json as Note, ...prev]);
      setContent("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("multidisciplinary_notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Privacy banner */}
      <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
        </svg>
        <p className="text-xs font-semibold text-amber-700">
          Acesso exclusivo do profissional — não visível para a família
        </p>
      </div>

      {/* New note */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <textarea
          rows={4}
          placeholder="Anote qualquer informação relevante sobre este paciente…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none transition focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/10"
        />
        {error && (
          <p className="text-xs text-red-600 mt-2">{error}</p>
        )}
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#1a4a3a" }}
          >
            {saving ? "Salvando…" : "Salvar nota"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma nota registrada.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap flex-1">
                  {note.technical_note}
                </p>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40 mt-0.5"
                  title="Excluir nota"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {formatNoteDate(note.created_at)}
                {note.profiles?.full_name && ` · ${note.profiles.full_name}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

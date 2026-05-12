"use client";

import { useTransition } from "react";
import { togglePublicarNota } from "./actions";

type Props = {
  noteId: string;
  publicado: boolean;
  patientId: string;
};

export default function PublicarNotaToggle({ noteId, publicado, patientId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      togglePublicarNota(noteId, publicado, patientId);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
      style={
        publicado
          ? { backgroundColor: "#F0FFF4", color: "#166534" }
          : { backgroundColor: "#F3F4F6", color: "#6B7280" }
      }
      title={publicado ? "Publicado no portal da família — clique para despublicar" : "Clique para publicar no portal da família"}
    >
      {isPending ? (
        <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
      ) : publicado ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
      {publicado ? "Publicada" : "Publicar"}
    </button>
  );
}

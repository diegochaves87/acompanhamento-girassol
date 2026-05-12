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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap"
      style={
        publicado
          ? { backgroundColor: "#FEF2F2", color: "#DC2626" }
          : { backgroundColor: "#F0FFF4", color: "#166534" }
      }
      title={publicado ? "Clique para ocultar desta família" : "Clique para publicar no portal da família"}
    >
      {isPending ? (
        <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
      ) : publicado ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 4.3-5.567M9.878 9.878a3 3 0 0 0 4.243 4.243M9.88 9.88l-3.29-3.29M14.12 14.12l3.292 3.292M3 3l18 18" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
      {publicado ? "Ocultar da família" : "Publicar para família"}
    </button>
  );
}

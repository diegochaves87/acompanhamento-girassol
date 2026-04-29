"use client";

import { useRef } from "react";

type Props = {
  variant?: "outline" | "ghost";
};

export default function ImportarExcelButton({ variant = "ghost" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Importação será implementada quando a tabela pacientes estiver criada
    alert(`Arquivo selecionado: ${file.name}\nImportação será disponibilizada em breve.`);
    e.target.value = "";
  }

  const base = "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80";
  const styles =
    variant === "outline"
      ? `${base} border-2`
      : base;

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
        className={styles}
        style={
          variant === "outline"
            ? { borderColor: "#1a4a3a", color: "#1a4a3a" }
            : { backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
        </svg>
        Importar Excel
      </button>
    </>
  );
}

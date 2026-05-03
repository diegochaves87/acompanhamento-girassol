"use client";

export type CsvHeader = { key: string; label: string };
export type CsvRow = Record<string, string | number | null>;

export default function ExportarCSV({
  filename,
  headers,
  rows,
  label = "Exportar Excel",
}: {
  filename: string;
  headers: CsvHeader[];
  rows: CsvRow[];
  label?: string;
}) {
  function handleExport() {
    const headerLine = headers.map((h) => `"${h.label}"`).join(";");
    const dataLines = rows.map((row) =>
      headers.map((h) => `"${row[h.key] ?? ""}"`).join(";")
    );
    const csv = [headerLine, ...dataLines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      {label}
    </button>
  );
}

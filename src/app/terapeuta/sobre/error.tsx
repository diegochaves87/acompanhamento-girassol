"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h2 style={{ color: "#c0392b" }}>Erro ao carregar a página</h2>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, marginTop: 16 }}>
        {error?.message ?? "Erro desconhecido"}
      </pre>
    </div>
  );
}

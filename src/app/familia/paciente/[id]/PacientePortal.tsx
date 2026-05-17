"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Evolucao = {
  id: string;
  texto: string;
  publishedAt: string;
  terapeutaNome: string;
  terapeutaEspec: string | null;
  terapeutaFoto: string | null;
  colorIndex: number;
};

export type Relatorio = {
  id: string;
  titulo: string;
  conteudo: string;
  createdAt: string;
  terapeutaNome: string;
  periodoInicio: string | null;
  periodoFim: string | null;
};

type Props = {
  patientId: string;
  patientNome: string;
  patientFoto: string | null;
  evolucoes: Evolucao[];
  relatorios: Relatorio[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CORES_TERAPEUTA = ["#4CAF50", "#8E6CCF", "#2E7BC1", "#FF5C7A", "#FFBA3D", "#1D3557"];

function tempoRelativo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  if (min < 60)  return "agora";
  if (h < 24)    return `há ${h}h`;
  if (d === 1)   return "ontem";
  if (d < 7)     return `há ${d} dias`;
  const w = Math.floor(d / 7);
  if (w < 5)     return `há ${w} sem.`;
  const m = Math.floor(d / 30);
  if (m < 12)    return `há ${m} ${m === 1 ? "mês" : "meses"}`;
  return `há ${Math.floor(d / 365)} ano${Math.floor(d / 365) > 1 ? "s" : ""}`;
}

function iniciais(nome: string): string {
  const p = nome.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : nome.slice(0, 2).toUpperCase();
}

function fmtData(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PacientePortal({ patientNome, evolucoes, relatorios }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"evolucoes" | "relatorios">("evolucoes");
  const [modalRel, setModalRel] = useState<Relatorio | null>(null);

  return (
    <div style={{ backgroundColor: "#FFF7E6", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: "#1D3557", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center" }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0, flex: 1, textAlign: "center" }}>
            {patientNome}
          </h1>
          <div style={{ width: 32 }} />
        </div>

        {/* ── Abas ── */}
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", backgroundColor: "#fff" }}>
          {(["evolucoes", "relatorios"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer", background: "none",
                fontSize: 14, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? "#1D3557" : "#9CA3AF",
                borderBottom: tab === t ? "3px solid #FFBA3D" : "3px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {t === "evolucoes" ? "Evoluções" : "Relatórios"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>

        {/* ABA: Evoluções */}
        {tab === "evolucoes" && (
          <div>
            {evolucoes.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: "32px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <p style={{ color: "#9CA3AF", fontSize: 14 }}>Nenhuma evolução compartilhada ainda.</p>
              </div>
            ) : (
              evolucoes.map((ev, i) => {
                const cor = CORES_TERAPEUTA[ev.colorIndex % CORES_TERAPEUTA.length];
                return (
                  <div
                    key={ev.id}
                    style={{
                      background: "#fff", borderRadius: 12, marginBottom: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    {/* Barra colorida à esquerda */}
                    <div style={{ width: 4, flexShrink: 0, backgroundColor: cor }} />

                    <div style={{ flex: 1, padding: "14px 14px 14px 12px" }}>
                      {/* Cabeçalho do card */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        {/* Avatar do terapeuta */}
                        {ev.terapeutaFoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ev.terapeutaFoto}
                            alt={ev.terapeutaNome}
                            style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                            backgroundColor: cor, display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: 11, fontWeight: 700,
                          }}>
                            {iniciais(ev.terapeutaNome)}
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: "#1D3557", margin: 0, lineHeight: 1.3 }}>
                            {ev.terapeutaNome}
                          </p>
                          {ev.terapeutaEspec && (
                            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{ev.terapeutaEspec}</p>
                          )}
                        </div>

                        <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
                          {tempoRelativo(ev.publishedAt)}
                        </span>
                      </div>

                      {/* Texto da evolução */}
                      {ev.texto ? (
                        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
                          {ev.texto}
                        </p>
                      ) : (
                        <p style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic", margin: 0 }}>
                          Sem texto disponível.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ABA: Relatórios */}
        {tab === "relatorios" && (
          <div>
            {relatorios.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: "32px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <p style={{ color: "#9CA3AF", fontSize: 14 }}>Nenhum relatório disponível ainda.</p>
              </div>
            ) : (
              relatorios.map((rel) => (
                <div
                  key={rel.id}
                  style={{
                    background: "#fff", borderRadius: 12, marginBottom: 12, padding: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>📋</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#1D3557", margin: "0 0 4px" }}>
                        {rel.titulo}
                      </p>
                      <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 2px" }}>
                        {rel.terapeutaNome}
                        {rel.periodoInicio && rel.periodoFim && (
                          <> · {fmtData(rel.periodoInicio)} – {fmtData(rel.periodoFim)}</>
                        )}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                        Criado em {fmtData(rel.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setModalRel(rel)}
                    style={{
                      marginTop: 12, width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #1D3557",
                      background: "none", color: "#1D3557", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Ler relatório completo
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ── Modal do relatório ── */}
      {modalRel && (
        <div
          onClick={() => setModalRel(null)}
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 100,
            display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 0",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
              maxHeight: "88vh", display: "flex", flexDirection: "column",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
            }}
          >
            {/* Modal header */}
            <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#1D3557", margin: 0 }}>{modalRel.titulo}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{modalRel.terapeutaNome}</p>
                </div>
                <button
                  onClick={() => setModalRel(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9CA3AF" }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: "16px 20px 28px", overflowY: "auto" }}>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, margin: 0, fontFamily: "Georgia, serif", whiteSpace: "pre-wrap" }}>
                {modalRel.conteudo}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

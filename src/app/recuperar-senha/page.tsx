"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/nova-senha`
        : "https://www.acompanhamentogirassol.com.br/nova-senha";

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (err) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
    } else {
      setSent(true);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none",
    boxSizing: "border-box", backgroundColor: "#fff", color: "#111827",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF7E6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/identidade-visual/Logo-Nome-Slogan.png"
        alt="Acompanhamento Girassol"
        style={{ height: 80, marginBottom: 28, objectFit: "contain" }}
      />

      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "36px 32px", width: "100%", maxWidth: 420 }}>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#F0FFF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ color: "#1D3557", fontWeight: 700, fontSize: 20, margin: "0 0 8px" }}>
              Verifique seu e-mail!
            </h2>
            <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              Enviamos um link para redefinir sua senha. Verifique sua caixa de entrada e spam.
            </p>
            <Link
              href="/login"
              style={{ display: "block", padding: "13px 0", borderRadius: 12, textAlign: "center", backgroundColor: "#1D3557", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ color: "#1D3557", fontWeight: 700, fontSize: 22, margin: "0 0 8px", textAlign: "center" }}>
              Recuperar senha
            </h2>
            <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={inputStyle}
              />

              {error && (
                <p style={{ fontSize: 13, color: "#DC2626", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ padding: "13px 0", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer", backgroundColor: "#1D3557", color: "#fff", fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1, transition: "opacity 0.2s" }}
              >
                {loading ? "Enviando…" : "Enviar link de recuperação"}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Link href="/login" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>
                ← Voltar ao login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

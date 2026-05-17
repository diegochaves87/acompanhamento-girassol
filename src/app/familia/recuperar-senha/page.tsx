"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase  = createClient();
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoading(false);
    if (err) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
    } else {
      setSent(true);
    }
  }

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#FFF7E6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/identidade-visual/Logo-Nome-Slogan.png"
        alt="Acompanhamento Girassol"
        style={{ height: 56, marginBottom: 32, objectFit: "contain" }}
      />

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.09)", padding: "32px 28px", width: "100%", maxWidth: 400 }}>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ color: "#1D3557", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              E-mail enviado!
            </h2>
            <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </p>
            <Link
              href="/familia/login"
              style={{
                display: "block", padding: "12px 0", borderRadius: 10, textAlign: "center",
                backgroundColor: "#1D3557", color: "#fff", fontWeight: 600, fontSize: 14,
                textDecoration: "none",
              }}
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ color: "#1D3557", fontWeight: 700, fontSize: 20, marginBottom: 6, textAlign: "center" }}>
              Recuperar senha
            </h2>
            <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB",
                    fontSize: 14, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "#EF4444", margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "13px 0", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
                  backgroundColor: "#1D3557", color: "#fff", fontWeight: 700, fontSize: 15,
                  opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
                }}
              >
                {loading ? "Enviando…" : "Enviar link de recuperação"}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Link
                href="/familia/login"
                style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}
              >
                ← Voltar ao login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

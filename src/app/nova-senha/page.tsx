"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NovaSenhaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setSessionError(true);
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
      if (err) {
        setSessionError(true);
      } else {
        setReady(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError("Não foi possível atualizar a senha. Tente solicitar um novo link.");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
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

        {sessionError && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ color: "#1D3557", fontWeight: 700, fontSize: 20, margin: "0 0 8px" }}>
              Link inválido ou expirado
            </h2>
            <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              Solicite um novo link de recuperação de senha.
            </p>
            <Link
              href="/recuperar-senha"
              style={{ display: "block", padding: "13px 0", borderRadius: 12, textAlign: "center", backgroundColor: "#1D3557", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
            >
              Solicitar novo link
            </Link>
          </div>
        )}

        {!sessionError && !ready && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p style={{ color: "#6B7280", fontSize: 14 }}>Verificando link…</p>
          </div>
        )}

        {ready && !success && (
          <>
            <h2 style={{ color: "#1D3557", fontWeight: 700, fontSize: 22, margin: "0 0 8px", textAlign: "center" }}>
              Criar nova senha
            </h2>
            <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
              Escolha uma nova senha para sua conta.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nova senha"
                required
                style={inputStyle}
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmar nova senha"
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
                {loading ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}

        {success && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#F0FFF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ color: "#1D3557", fontWeight: 700, fontSize: 20, margin: "0 0 8px" }}>
              Senha atualizada com sucesso!
            </h2>
            <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              Redirecionando para o login…
            </p>
            <Link
              href="/login"
              style={{ display: "block", padding: "13px 0", borderRadius: 12, textAlign: "center", backgroundColor: "#1D3557", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
            >
              Ir para o login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("E-mail ou senha incorretos. Tente novamente.");
      setLoading(false);
      return;
    }

    const { data: { user: loggedUser } } = await supabase.auth.getUser();

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", loggedUser!.id)
      .maybeSingle();

    if (userData?.role === "therapist") {
      router.push("/terapeuta");
      return;
    }

    const { data: familiarData } = await supabase
      .from("family_access")
      .select("id")
      .eq("email", loggedUser!.email!)
      .eq("status", "ativo")
      .maybeSingle();

    if (familiarData) {
      router.push("/familia/dashboard");
      return;
    }

    setError("Acesso não autorizado. Entre em contato com seu terapeuta.");
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
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
        src="/identidade-visual/logo-vetorizada.svg"
        alt="Acompanhamento Girassol"
        style={{ height: 80, marginBottom: 28, objectFit: "contain" }}
      />

      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "36px 32px", width: "100%", maxWidth: 420 }}>
        <h2 style={{ color: "#1D3557", fontWeight: 700, fontSize: 22, margin: "0 0 24px", textAlign: "center" }}>
          Acessar minha conta
        </h2>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <Link
            href="/recuperar-senha"
            style={{ fontSize: 13, color: "#6B7280", textAlign: "center", textDecoration: "none" }}
          >
            Esqueci minha senha
          </Link>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>ou</span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
        </div>

        <button
          onClick={handleGoogle}
          type="button"
          style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1.5px solid #E5E7EB", cursor: "pointer", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#1D3557" }}
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 24, marginBottom: 0 }}>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" style={{ color: "#1D3557", fontWeight: 700, textDecoration: "none" }}>
            Crie aqui
          </Link>
        </p>
      </div>

      <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 28 }}>
        Acompanhamento Girassol &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

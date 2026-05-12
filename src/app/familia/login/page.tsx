"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.618 14.233 17.64 11.925 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export default function FamiliaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (authError) {
      setError("E-mail ou senha incorretos. Verifique e tente novamente.");
      setLoading(false);
      return;
    }
    window.location.href = "/familia/dashboard";
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    const supabase = createClient();
    const { error: fErr } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setForgotLoading(false);
    setForgotStatus(fErr ? "error" : "sent");
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: "#FFF7E6" }}>
      {/* Logo */}
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/identidade-visual/Logo-Nome-Slogan.png" alt="Acompanhamento Girassol" style={{ height: 64, margin: "0 auto 8px" }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#4CAF50" }}>
          Gratuito para você, sempre.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1
          className="text-xl font-bold mb-1 text-center"
          style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
        >
          Acesse o acompanhamento
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">do seu familiar</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ backgroundColor: "#1D3557" }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => { setForgotEmail(email); setShowForgot(true); setForgotStatus("idle"); }}
            className="text-xs text-center transition-colors hover:underline"
            style={{ color: "#9CA3AF" }}
          >
            Esqueci minha senha
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGoogle}
          type="button"
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          style={{ color: "#1D3557" }}
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <p className="text-center text-xs mt-5" style={{ color: "#9CA3AF" }}>
          Não tem conta ainda?{" "}
          <Link href="/familia" className="font-semibold hover:underline" style={{ color: "#8E6CCF" }}>
            Recebi um convite
          </Link>
        </p>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForgot(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-1" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
              Recuperar senha
            </h3>
            {forgotStatus === "sent" ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F0FFF4" }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="#4CAF50" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">E-mail enviado!</p>
                <p className="text-xs text-gray-400 mt-1">Verifique sua caixa de entrada.</p>
                <button onClick={() => setShowForgot(false)} className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ backgroundColor: "#4CAF50" }}>Fechar</button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4 mt-3">
                <input type="email" required placeholder="seu@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className={inputCls} />
                {forgotStatus === "error" && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">Erro ao enviar. Verifique o e-mail.</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForgot(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={forgotLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: "#4CAF50" }}>
                    {forgotLoading ? "Enviando…" : "Enviar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

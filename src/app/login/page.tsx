"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Create account side (just redirects to /cadastro)
  const [newEmail, setNewEmail] = useState("");

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      setLoginError("E-mail ou senha incorretos. Tente novamente.");
      setLoginLoading(false);
      return;
    }
    window.location.href = "/";
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const q = newEmail ? `?email=${encodeURIComponent(newEmail)}` : "";
    router.push(`/cadastro${q}`);
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotStatus("idle");
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setForgotLoading(false);
    setForgotStatus(error ? "error" : "sent");
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: "#F9FAFB" }}>

      {/* Logo */}
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-completa.png"
          alt="Acompanhamento Girassol"
          style={{ height: 72, margin: "0 auto 12px" }}
        />
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
          Jornada de Evolução Terapêutica
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Left — criar conta */}
        <div
          className="rounded-2xl border p-7 flex flex-col"
          style={{ backgroundColor: "#F0FFF4", borderColor: "#BBF7D0" }}
        >
          <div className="mb-5">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#4CAF50", color: "#ffffff" }}
            >
              Novo por aqui?
            </span>
            <h2 className="text-xl font-bold leading-snug" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
              Quero criar<br />uma conta
            </h2>
            <p className="text-sm mt-2" style={{ color: "#4CAF50" }}>
              Acesse gratuitamente por 30 dias.
            </p>
          </div>

          <form onSubmit={handleContinue} className="flex flex-col gap-4 flex-1">
            <input
              type="email"
              placeholder="Seu e-mail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputCls}
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#4CAF50" }}
            >
              Continuar
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>

          <p className="text-xs text-center mt-5" style={{ color: "#6B7280" }}>
            Ao continuar você concorda com nossos termos de uso.
          </p>
        </div>

        {/* Right — login */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col">
          <div className="mb-5">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#EFF6FF", color: "#2E7BC1" }}
            >
              Já sou cliente
            </span>
            <h2 className="text-xl font-bold leading-snug" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
              Acessar<br />minha conta
            </h2>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 flex-1">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="E-mail"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={inputCls}
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Senha"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={inputCls}
            />

            {loginError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: "#1D3557" }}
            >
              {loginLoading ? "Entrando…" : "Entrar"}
            </button>

            <button
              type="button"
              onClick={() => { setForgotEmail(loginEmail); setShowForgot(true); setForgotStatus("idle"); }}
              className="text-xs text-center transition-colors hover:underline"
              style={{ color: "#9CA3AF" }}
            >
              Esqueci minha senha
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-xs mt-8" style={{ color: "#9CA3AF" }}>
        Acompanhamento Girassol © {new Date().getFullYear()}
      </p>

      {/* Modal — esqueci minha senha */}
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
            <p className="text-sm text-gray-500 mb-5">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>

            {forgotStatus === "sent" ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F0FFF4" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#4CAF50" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">E-mail enviado!</p>
                <p className="text-xs text-gray-400 mt-1">Verifique sua caixa de entrada e spam.</p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#4CAF50", color: "#fff" }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={inputCls}
                />
                {forgotStatus === "error" && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                    Erro ao enviar. Verifique o e-mail e tente novamente.
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: "#4CAF50" }}
                  >
                    {forgotLoading ? "Enviando…" : "Enviar link"}
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

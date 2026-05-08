"use client";

import { useState } from "react";
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

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium">ou</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [newEmail, setNewEmail] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
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

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotStatus("idle");
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setForgotLoading(false);
    setForgotStatus(error ? "error" : "sent");
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white";

  const googleBtnCls =
    "w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 border border-gray-200 bg-white hover:bg-gray-50 transition-colors";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: "#F9FAFB" }}>

      {/* Logo */}
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-completa.png" alt="Acompanhamento Girassol" style={{ height: 72, margin: "0 auto 12px" }} />
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
          Jornada de Evolução Terapêutica
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Left — criar conta */}
        <div className="rounded-2xl border p-7 flex flex-col gap-4" style={{ backgroundColor: "#F0FFF4", borderColor: "#BBF7D0" }}>
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#4CAF50", color: "#ffffff" }}>
              Novo por aqui?
            </span>
            <h2 className="text-xl font-bold leading-snug" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
              Quero criar<br />uma conta
            </h2>
            <p className="text-sm mt-2" style={{ color: "#4CAF50" }}>Acesse gratuitamente por 30 dias.</p>
          </div>

          <form onSubmit={handleContinue} className="flex flex-col gap-3">
            <input type="email" placeholder="Seu e-mail" value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)} className={inputCls} />
            <button type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#4CAF50" }}>
              Continuar
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>

          <Divider />

          <button onClick={handleGoogle} type="button" className={googleBtnCls} style={{ color: "#1D3557" }}>
            <GoogleIcon />
            Continuar com Google
          </button>

          <p className="text-xs text-center" style={{ color: "#6B7280" }}>
            Ao continuar você concorda com nossos termos de uso.
          </p>
        </div>

        {/* Right — login */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col gap-4">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#EFF6FF", color: "#2E7BC1" }}>
              Já sou cliente
            </span>
            <h2 className="text-xl font-bold leading-snug" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
              Acessar<br />minha conta
            </h2>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input type="email" required autoComplete="email" placeholder="E-mail"
              value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputCls} />
            <input type="password" required autoComplete="current-password" placeholder="Senha"
              value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputCls} />

            {loginError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{loginError}</p>
            )}

            <button type="submit" disabled={loginLoading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: "#1D3557" }}>
              {loginLoading ? "Entrando…" : "Entrar"}
            </button>

            <button type="button"
              onClick={() => { setForgotEmail(loginEmail); setShowForgot(true); setForgotStatus("idle"); }}
              className="text-xs text-center transition-colors hover:underline" style={{ color: "#9CA3AF" }}>
              Esqueci minha senha
            </button>
          </form>

          <Divider />

          <button onClick={handleGoogle} type="button" className={googleBtnCls} style={{ color: "#1D3557" }}>
            <GoogleIcon />
            Continuar com Google
          </button>
        </div>
      </div>

      <p className="text-center text-xs mt-8" style={{ color: "#9CA3AF" }}>
        Acompanhamento Girassol © {new Date().getFullYear()}
      </p>

      {/* Modal — esqueci minha senha */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForgot(false); }}>
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
                <button onClick={() => setShowForgot(false)}
                  className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#4CAF50", color: "#fff" }}>
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <input type="email" required placeholder="seu@email.com" value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)} className={inputCls} />
                {forgotStatus === "error" && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                    Erro ao enviar. Verifique o e-mail e tente novamente.
                  </p>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForgot(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: "#4CAF50" }}>
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

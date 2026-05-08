"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Invite {
  id: string;
  nome: string;
  email: string | null;
  status: string;
  patient_id: string;
  patients?: { full_name: string };
}

function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/identidade-visual/Logo-Nome-Slogan.png"
      alt="Acompanhamento Girassol"
      style={{ height: 56, margin: "0 auto 24px", display: "block" }}
    />
  );
}

export default function ConvitePage({ params }: { params: { token: string } }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function fetchInvite() {
      const supabase = createClient();
      const { data } = await supabase
        .from("family_access")
        .select("id, nome, email, status, patient_id, patients(full_name)")
        .eq("invite_token", params.token)
        .maybeSingle();
      setLoading(false);
      if (!data) { setNotFound(true); return; }
      const inv = data as unknown as Invite;
      setInvite(inv);
      if (inv.email) setEmailInput(inv.email);
    }
    fetchInvite();
  }, [params.token]);

  const emailPreFilled = !!(invite?.email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailToUse = emailInput.trim();
    if (!emailToUse) { setError("Informe seu e-mail para criar a conta."); return; }
    if (senha.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (senha !== confirmar) { setError("As senhas não coincidem."); return; }
    setSubmitting(true); setError("");

    const supabase = createClient();

    // Se o email não estava pré-preenchido, salva no registro do convite
    if (!invite!.email) {
      await supabase
        .from("family_access")
        .update({ email: emailToUse })
        .eq("id", invite!.id);
    }

    const { error: authError } = await supabase.auth.signUp({ email: emailToUse, password: senha });
    if (authError && !authError.message.includes("already registered")) {
      setError("Erro ao criar conta: " + authError.message);
      setSubmitting(false);
      return;
    }

    await supabase
      .from("family_access")
      .update({ status: "aguardando_aprovacao" })
      .eq("id", invite!.id);

    setSubmitting(false);
    setDone(true);
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF7E6" }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#4CAF50", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#FFF7E6" }}>
        <Logo />
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FEF2F2" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-bold text-gray-800 mb-2" style={{ fontFamily: "var(--font-poppins, sans-serif)" }}>Convite não encontrado</p>
          <p className="text-sm text-gray-500">Este link pode ter expirado ou já foi utilizado.</p>
          <Link href="/" className="mt-5 inline-block text-sm font-semibold" style={{ color: "#4CAF50" }}>Voltar ao início</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#FFF7E6" }}>
        <Logo />
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#F0FFF4" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke="#4CAF50" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Cadastro realizado!
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Aguarde a aprovação do terapeuta para acessar o acompanhamento de{" "}
            <strong>{invite?.patients?.full_name ?? "seu familiar"}</strong>.
          </p>
          <p className="text-xs text-gray-400 mt-3">Você receberá uma confirmação assim que o acesso for liberado.</p>
        </div>
      </div>
    );
  }

  if (invite?.status === "ativo") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#FFF7E6" }}>
        <Logo />
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <p className="font-bold text-gray-800 mb-2" style={{ fontFamily: "var(--font-poppins, sans-serif)" }}>Acesso já ativo</p>
          <p className="text-sm text-gray-500">Você já tem acesso ao portal. Faça login para continuar.</p>
          <Link
            href="/login"
            className="mt-5 inline-block px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1D3557" }}
          >
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  const patientName = invite?.patients?.full_name ?? "seu familiar";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: "#FFF7E6" }}>
      <Logo />
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="mb-6 text-center">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: "#F0FFF4", color: "#4CAF50" }}
          >
            Convite de acesso
          </span>
          <h2 className="text-xl font-bold leading-snug" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Você foi convidado para acompanhar o desenvolvimento de{" "}
            <span style={{ color: "#4CAF50" }}>{patientName}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Crie uma conta para começar a acompanhar cada sessão com carinho.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nome — readonly */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Seu nome</label>
            <input
              type="text"
              readOnly
              value={invite?.nome ?? ""}
              className={`${inputCls} bg-gray-50 cursor-not-allowed`}
            />
          </div>

          {/* Email — readonly se pré-preenchido, editável se não */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>
              E-mail {!emailPreFilled && <span className="text-red-400">*</span>}
            </label>
            {emailPreFilled ? (
              <input
                type="email"
                readOnly
                value={emailInput}
                className={`${inputCls} bg-gray-50 cursor-not-allowed`}
              />
            ) : (
              <>
                <input
                  type="email"
                  required
                  placeholder="Informe seu e-mail para criar a conta"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">Você usará este e-mail para fazer login.</p>
              </>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Criar senha</label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Confirmar senha</label>
            <input
              type="password"
              required
              placeholder="Repita a senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#4CAF50" }}
          >
            {submitting ? "Criando conta..." : "Criar minha conta"}
          </button>
        </form>

        <p className="text-center text-xs mt-5" style={{ color: "#9CA3AF" }}>
          Ao criar sua conta você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}

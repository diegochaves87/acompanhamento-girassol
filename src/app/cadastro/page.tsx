"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const PLANOS = ["Básico", "Profissional", "Premium"];

export default function CadastroPage() {
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    profissao: "",
    email: "",
    telefone: "",
    endereco: "",
    plano: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function applyCpf(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    const formatted = d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
    set("cpf", formatted);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: dbError } = await supabase.from("pending_users").insert({
      nome: form.nome,
      cpf: form.cpf.replace(/\D/g, "") || null,
      profissao: form.profissao || null,
      email: form.email,
      telefone: form.telefone || null,
      endereco: form.endereco || null,
      plano: form.plano || null,
    });

    setLoading(false);
    if (dbError) {
      setError("Erro ao enviar cadastro. Tente novamente.");
      return;
    }
    setSuccess(true);
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#F0FFF4" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4CAF50" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Cadastro enviado!
          </h2>
          <p className="text-sm text-gray-500">
            Seu cadastro foi recebido e está aguardando aprovação. Você receberá um e-mail quando for aprovado.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#4CAF50", color: "#ffffff" }}
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-10" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-completa.png" alt="Girassol" style={{ height: 70, margin: "0 auto 16px" }} />
          <h1 className="text-2xl font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Solicitar acesso
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Preencha os dados abaixo. Nossa equipe aprovará seu cadastro em breve.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          <div>
            <label className={labelClass}>Nome completo *</label>
            <input type="text" required placeholder="Seu nome completo" value={form.nome}
              onChange={(e) => set("nome", e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>E-mail *</label>
            <input type="email" required placeholder="seu@email.com" value={form.email}
              onChange={(e) => set("email", e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>CPF</label>
              <input type="text" inputMode="numeric" placeholder="000.000.000-00" value={form.cpf}
                onChange={(e) => applyCpf(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input type="tel" placeholder="(00) 00000-0000" value={form.telefone}
                onChange={(e) => set("telefone", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Profissão / Especialidade</label>
            <input type="text" placeholder="Ex: Terapeuta Ocupacional, Psicóloga…" value={form.profissao}
              onChange={(e) => set("profissao", e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Endereço</label>
            <input type="text" placeholder="Cidade, Estado" value={form.endereco}
              onChange={(e) => set("endereco", e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Plano de interesse</label>
            <select value={form.plano} onChange={(e) => set("plano", e.target.value)}
              className={`${inputClass} bg-white`}>
              <option value="">Selecione (opcional)</option>
              {PLANOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ backgroundColor: "#4CAF50" }}
          >
            {loading ? "Enviando…" : "Solicitar acesso"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Já tem acesso?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#4CAF50" }}>
              Entrar
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}

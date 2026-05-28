"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Icons ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const poppins = "var(--font-poppins, sans-serif)";
const inter = "var(--font-inter, sans-serif)";

// ─── NavBar ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Início", href: "#inicio" },
  { label: "Nossa História", href: "#nossa-historia" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para Famílias", href: "#familias" },
  { label: "Contato", href: "#contato" },
];

function NavBar({ openLogin }: { openLogin: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-shadow duration-300"
      style={{
        height: 144,
        backgroundColor: "#fff",
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
        borderBottom: scrolled ? "none" : "1px solid #F3F4F6",
        fontFamily: inter,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-full">
        <Link href="/" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/identidade-visual/Logo-Nome-Slogan.png" alt="Acompanhamento Girassol" style={{ height: 128 }} />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="text-sm font-medium transition-opacity hover:opacity-60"
              style={{ color: "#374151" }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={openLogin}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#1D3557", color: "#1D3557", backgroundColor: "transparent", cursor: "pointer" }}>
            Entrar
          </button>
          <Link href="/cadastro"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1D3557" }}>
            Começar grátis
          </Link>
        </div>

        <button className="lg:hidden p-2 flex flex-col gap-1.5" onClick={() => setOpen(!open)} aria-label="Menu">
          <span className={`block w-5 h-0.5 transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-2" : ""}`} style={{ backgroundColor: "#1D3557" }} />
          <span className={`block w-5 h-0.5 transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`} style={{ backgroundColor: "#1D3557" }} />
          <span className={`block w-5 h-0.5 transition-all duration-300 origin-center ${open ? "-rotate-45 -translate-y-2" : ""}`} style={{ backgroundColor: "#1D3557" }} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden absolute left-0 right-0 bg-white border-t shadow-xl px-6 py-5 flex flex-col gap-1 z-50"
          style={{ top: 144, borderColor: "#F3F4F6", fontFamily: inter }}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="py-2.5 text-sm font-medium border-b" style={{ color: "#374151", borderColor: "#F9FAFB" }}>
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3">
            <button onClick={() => { setOpen(false); openLogin(); }}
              className="py-3 rounded-xl text-sm font-semibold text-center border"
              style={{ borderColor: "#1D3557", color: "#1D3557", backgroundColor: "transparent", cursor: "pointer", width: "100%" }}>
              Entrar
            </button>
            <Link href="/cadastro" onClick={() => setOpen(false)}
              className="py-3 rounded-xl text-sm font-bold text-white text-center"
              style={{ backgroundColor: "#1D3557" }}>
              Começar grátis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ openLogin }: { openLogin: () => void }) {
  return (
    <section id="inicio" style={{ backgroundColor: "#FFF7E6", paddingTop: 144, minHeight: "90vh", fontFamily: inter }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center min-h-[calc(90vh-144px)]">

        {/* Left */}
        <div className="flex flex-col gap-7">
          <span
            className="inline-flex self-start items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
            style={{ backgroundColor: "#4CAF50", color: "#fff" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
            Para terapeutas e clínicas
          </span>

          <h1 style={{ fontFamily: poppins, fontSize: "clamp(36px,4.5vw,52px)", fontWeight: 700, lineHeight: 1.18, color: "#1D3557", margin: 0 }}>
            Gerencie seus pacientes e encante as famílias,{" "}
            <span style={{ color: "#8E6CCF" }}>tudo em um só lugar.</span>
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4B5563", maxWidth: 520 }}>
            O Acompanhamento Girassol conecta você às famílias dos seus pacientes com organização, clareza e muito cuidado.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/cadastro"
              className="px-8 py-4 rounded-xl text-base font-bold text-white text-center transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ backgroundColor: "#1D3557" }}>
              Crie sua conta
            </Link>
            <button
              onClick={openLogin}
              className="px-8 py-4 rounded-xl text-base font-semibold text-center border-2 transition-all hover:bg-white"
              style={{ borderColor: "#1D3557", color: "#1D3557", backgroundColor: "transparent", cursor: "pointer" }}>
              Já tenho conta
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                { bg: "#8E6CCF", label: "A" },
                { bg: "#4CAF50", label: "C" },
                { bg: "#2E7BC1", label: "R" },
                { bg: "#FF5C7A", label: "M" },
                { bg: "#FFBA3D", label: "F" },
              ].map(({ bg, label }, i) => (
                <div key={i}
                  className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: bg }}>
                  {label}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, color: "#6B7280", fontFamily: inter }}>
              <strong style={{ color: "#1D3557" }}>+50 terapeutas</strong> já transformam sua prática com o Girassol
            </p>
          </div>

          {/* Micro-badges */}
          <div className="flex flex-wrap gap-3">
            {["30 dias grátis", "Sem cartão", "Cancele quando quiser"].map((txt) => (
              <span key={txt}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "#F0FFF4", color: "#166534" }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16">
                  <path d="M3 8l4 4 6-6" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {txt}
              </span>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="relative flex items-center justify-center" style={{ minHeight: 520 }}>

          {/* Semicírculo azul escuro — canto inferior direito, atrás da imagem */}
          <div
            className="absolute rounded-tl-full rounded-bl-full"
            style={{ width: 260, height: 480, backgroundColor: "#1D3557", right: -20, bottom: -20, zIndex: 1, opacity: 0.12 }}
          />

          {/* 3 pétalas amarelas — canto superior direito */}
          <svg className="absolute" style={{ top: 0, right: 8, zIndex: 3 }} width="80" height="90" viewBox="0 0 80 90" fill="none">
            <ellipse cx="60" cy="18" rx="9" ry="17" fill="#FFC107" transform="rotate(-20 60 18)" opacity="0.9" />
            <ellipse cx="72" cy="38" rx="9" ry="17" fill="#FFC107" transform="rotate(20 72 38)" opacity="0.75" />
            <ellipse cx="52" cy="42" rx="9" ry="17" fill="#FFBA3D" transform="rotate(-55 52 42)" opacity="0.6" />
          </svg>

          {/* Folhas verdes — lado direito */}
          <svg className="absolute" style={{ right: -10, top: "38%", zIndex: 3 }} width="48" height="100" viewBox="0 0 48 100" fill="none">
            <path d="M36 10 Q48 30 30 50 Q20 35 36 10Z" fill="#4CAF50" opacity="0.7" />
            <path d="M40 50 Q52 70 28 82 Q22 65 40 50Z" fill="#4CAF50" opacity="0.5" />
          </svg>

          {/* Coração outline amarelo — canto superior esquerdo da imagem */}
          <svg className="absolute" style={{ top: 24, left: 24, zIndex: 4 }} width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="#FFBA3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Linha tracejada curva roxa — canto superior direito */}
          <svg className="absolute" style={{ top: 30, right: 30, zIndex: 3 }} width="90" height="60" viewBox="0 0 90 60" fill="none">
            <path d="M5 55 Q30 5 85 10" stroke="#8E6CCF" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" fill="none" opacity="0.7" />
          </svg>

          {/* Quebra-cabeça azul — canto superior direito, rotação 15deg */}
          <svg className="absolute" style={{ top: 60, right: 10, zIndex: 4, transform: "rotate(15deg)" }} width="40" height="40" viewBox="0 0 80 80" fill="none">
            <path d="M10,10 L10,35 Q15,35 15,40 Q15,45 10,45 L10,70 L35,70 Q35,65 40,65 Q45,65 45,70 L70,70 L70,45 Q65,45 65,40 Q65,35 70,35 L70,10 L45,10 Q45,15 40,15 Q35,15 35,10 Z"
              fill="#2E7BC1" opacity="0.8" />
          </svg>

          {/* Quebra-cabeça verde — lado direito, rotação -10deg */}
          <svg className="absolute" style={{ top: "42%", right: -8, zIndex: 4, transform: "rotate(-10deg)" }} width="35" height="35" viewBox="0 0 80 80" fill="none">
            <path d="M10,10 L10,35 Q15,35 15,40 Q15,45 10,45 L10,70 L35,70 Q35,65 40,65 Q45,65 45,70 L70,70 L70,45 Q65,45 65,40 Q65,35 70,35 L70,10 L45,10 Q45,15 40,15 Q35,15 35,10 Z"
              fill="#4CAF50" opacity="0.75" />
          </svg>

          {/* Quebra-cabeça roxo — canto inferior direito, rotação 25deg */}
          <svg className="absolute" style={{ bottom: 70, right: 4, zIndex: 4, transform: "rotate(25deg)" }} width="38" height="38" viewBox="0 0 80 80" fill="none">
            <path d="M10,10 L10,35 Q15,35 15,40 Q15,45 10,45 L10,70 L35,70 Q35,65 40,65 Q45,65 45,70 L70,70 L70,45 Q65,45 65,40 Q65,35 70,35 L70,10 L45,10 Q45,15 40,15 Q35,15 35,10 Z"
              fill="#8E6CCF" opacity="0.7" />
          </svg>

          {/* Quebra-cabeça rosa — lado direito superior, rotação -20deg */}
          <svg className="absolute" style={{ top: 160, right: -4, zIndex: 4, transform: "rotate(-20deg)" }} width="32" height="32" viewBox="0 0 80 80" fill="none">
            <path d="M10,10 L10,35 Q15,35 15,40 Q15,45 10,45 L10,70 L35,70 Q35,65 40,65 Q45,65 45,70 L70,70 L70,45 Q65,45 65,40 Q65,35 70,35 L70,10 L45,10 Q45,15 40,15 Q35,15 35,10 Z"
              fill="#FF5C7A" opacity="0.7" />
          </svg>

          {/* Hero image */}
          <div className="relative w-full" style={{ zIndex: 2, maxWidth: 640 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/identidade-visual/hero-home2.png"
              alt="Terapeuta e família"
              className="w-full object-contain"
              style={{ borderRadius: 24 }}
            />

            {/* Floating card */}
            <div
              className="absolute bottom-6 left-0 -translate-x-6 flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ backgroundColor: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 220, fontFamily: inter, zIndex: 5 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#F0FFF4" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "#1D3557" }}>Seguro e confiável</p>
                <p className="text-xs" style={{ color: "#6B7280" }}>Dados protegidos com criptografia</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── Especialidades ───────────────────────────────────────────────────────────

const SPECIALTIES = [
  { label: "Fisioterapia", color: "#2E7BC1", bg: "#EFF6FF" },
  { label: "Fonoaudiologia", color: "#8E6CCF", bg: "#F5F3FF" },
  { label: "Psicologia", color: "#FF5C7A", bg: "#FFF1F2" },
  { label: "Terapia Ocupacional", color: "#4CAF50", bg: "#F0FFF4" },
  { label: "Psicomotricidade", color: "#FFBA3D", bg: "#FFFBEB" },
  { label: "Neuropsicologia", color: "#1D3557", bg: "#F1F5F9" },
  { label: "ABA", color: "#E07B29", bg: "#FFF7ED" },
];

function SpecialtiesBanner() {
  return (
    <section style={{ backgroundColor: "#fff", paddingTop: 40, paddingBottom: 40, borderBottom: "1px solid #F3F4F6", fontFamily: inter }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <p className="text-center text-sm font-medium mb-6" style={{ color: "#9CA3AF" }}>
          Usado por profissionais de diversas especialidades
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {SPECIALTIES.map((s) => (
            <span key={s.label}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: s.bg, color: s.color }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "/identidade-visual/agenda.svg", color: "#2E7BC1", bg: "#EFF6FF", title: "Agenda inteligente", desc: "Organize seus atendimentos sem confusão. Tudo no lugar certo, sempre." },
  { icon: "/identidade-visual/evolucoes.svg", color: "#4CAF50", bg: "#F0FFF4", title: "Registro de evoluções", desc: "Documente cada sessão de forma rápida e profissional." },
  { icon: "/identidade-visual/financeiro.svg", color: "#FFBA3D", bg: "#FFFBEB", title: "Financeiro simplificado", desc: "Controle pagamentos, faltas e receitas sem precisar de planilha." },
  { icon: "/identidade-visual/mensagem.svg", color: "#8E6CCF", bg: "#F5F3FF", title: "Comunicação com família", desc: "Envie orientações e atualizações diretamente para os pais." },
  { icon: "/identidade-visual/arquivo.svg", color: "#FF5C7A", bg: "#FFF1F2", title: "Relatórios completos", desc: "Gere relatórios profissionais com um clique para laudos e devolutivas." },
  { icon: "/identidade-visual/clinica.svg", color: "#E07B29", bg: "#FFF7ED", title: "Acesso multi-clínica", desc: "Atenda em várias clínicas e gerencie tudo de um só lugar." },
];

function FeaturesSection() {
  return (
    <section id="funcionalidades" style={{ backgroundColor: "#fff", paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 style={{ fontFamily: poppins, fontSize: "clamp(28px,3vw,40px)", fontWeight: 700, color: "#1D3557", marginBottom: 16 }}>
            Tudo que você precisa para uma prática organizada e humanizada
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="rounded-2xl p-7 flex flex-col gap-4 group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ backgroundColor: f.bg, fontFamily: inter }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: f.color + "18" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.icon} alt={f.title} className="w-7 h-7" />
              </div>
              <h3 style={{ fontFamily: poppins, fontWeight: 700, fontSize: 17, color: "#1D3557" }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#4B5563" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mobile mockup ────────────────────────────────────────────────────────────

function MobileMockup() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="relative"
        style={{
          width: 260,
          height: 520,
          backgroundColor: "#1D3557",
          borderRadius: 36,
          padding: 10,
          boxShadow: "0 32px 80px rgba(29,53,87,0.3)",
        }}
      >
        {/* Notch */}
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 70, height: 22, backgroundColor: "#1D3557", borderRadius: 99, zIndex: 10 }} />
        {/* Screen */}
        <div style={{ backgroundColor: "#F8FAFC", borderRadius: 28, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: inter }}>
          {/* Status bar */}
          <div style={{ backgroundColor: "#fff", padding: "28px 16px 10px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#1D3557", fontFamily: poppins }}>Girassol Família</p>
            <p style={{ fontSize: 10, color: "#9CA3AF" }}>Olá, família Silva!</p>
          </div>
          {/* Content */}
          <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 8, overflowY: "hidden" }}>
            {/* Evolution card */}
            <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#F0FFF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14 }}>📋</span>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#1D3557" }}>Evolução de hoje</p>
                  <p style={{ fontSize: 9, color: "#9CA3AF" }}>Fisioterapia · 14h</p>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 9, backgroundColor: "#F0FFF4", color: "#4CAF50", fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>Nova</span>
              </div>
              <p style={{ fontSize: 10, color: "#4B5563", lineHeight: 1.5 }}>Pedro foi incrível hoje! Conseguiu manter o equilíbrio por mais tempo e adorou as atividades com bola.</p>
            </div>
            {/* Activity card */}
            <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14 }}>🏠</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#1D3557" }}>Atividade para casa</p>
              </div>
              <p style={{ fontSize: 10, color: "#4B5563", lineHeight: 1.5 }}>Praticar o equilíbrio em um pé por 30 segundos, 3x ao dia, sempre com supervisão.</p>
            </div>
            {/* Message card */}
            <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14 }}>💬</span>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#1D3557" }}>Mensagem da terapeuta</p>
                  <p style={{ fontSize: 9, color: "#9CA3AF" }}>Há 2h</p>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom nav */}
          <div style={{ backgroundColor: "#fff", padding: "8px 16px 10px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-around" }}>
            {["🏠", "📋", "💬", "📈"].map((icon, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: i === 0 ? "#4CAF50" : "transparent" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Diferencial Família ──────────────────────────────────────────────────────

const FAMILY_ITEMS = [
  "Família recebe resumo de cada sessão em tempo real",
  "Orientações de atividades para fazer em casa",
  "Comunicação direta com o terapeuta pelo app",
  "Histórico completo do desenvolvimento sempre disponível",
];

function FamilySection() {
  return (
    <section id="familias" style={{ backgroundColor: "#F0FFF4", paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="flex flex-col gap-7" style={{ fontFamily: inter }}>
          <span
            className="inline-flex self-start text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
            style={{ backgroundColor: "#F5F3FF", color: "#8E6CCF" }}>
            O diferencial que ninguém mais oferece
          </span>
          <h2 style={{ fontFamily: poppins, fontSize: "clamp(28px,3vw,40px)", fontWeight: 700, color: "#1D3557", lineHeight: 1.2 }}>
            Seus pacientes evoluem mais quando a família participa
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#4B5563" }}>
            Após cada sessão, a família recebe um resumo completo da evolução, orientações para praticar em casa e pode conversar diretamente com você. Mais vínculo, mais resultado.
          </p>
          <ul className="flex flex-col gap-4">
            {FAMILY_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "#4CAF50" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                    <path d="M3 8l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>
          <Link href="/cadastro"
            className="self-start px-7 py-3.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-white"
            style={{ borderColor: "#4CAF50", color: "#4CAF50" }}>
            Ver como a família enxerga
          </Link>
        </div>

        {/* Right: Mobile mockup */}
        <div className="flex justify-center">
          <MobileMockup />
        </div>
      </div>
    </section>
  );
}

// ─── Carrossel de funcionalidades ─────────────────────────────────────────────

const CAROUSEL_SLIDES = [
  { icon: "📅", color: "#2E7BC1", bg: "#EFF6FF", title: "Agende a sessão", desc: "Crie e gerencie agendamentos com facilidade. O paciente e a família ficam sempre informados sobre data, horário e local." },
  { icon: "📝", color: "#4CAF50", bg: "#F0FFF4", title: "Registre a evolução", desc: "Após cada sessão, documente os avanços com rapidez. O registro fica seguro e disponível para a família na hora." },
  { icon: "👨‍👩‍👧", color: "#8E6CCF", bg: "#F5F3FF", title: "Família acompanha", desc: "Os pais recebem uma notificação com o resumo da sessão, atividades para fazer em casa e podem conversar com você." },
  { icon: "📊", color: "#FFBA3D", bg: "#FFFBEB", title: "Gere o relatório", desc: "Com um clique, exporte um relatório profissional completo para devolutivas, laudos ou encaminhamentos." },
];

function CarouselSection() {
  const [current, setCurrent] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((idx: number) => {
    setCurrent((idx + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  }, []);

  useEffect(() => {
    timer.current = setTimeout(() => go(current + 1), 5000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [current, go]);

  const slide = CAROUSEL_SLIDES[current];

  return (
    <section id="como-funciona" style={{ backgroundColor: "#FFF7E6", paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <h2 className="text-center mb-12"
          style={{ fontFamily: poppins, fontSize: "clamp(28px,3vw,40px)", fontWeight: 700, color: "#1D3557" }}>
          Uma jornada completa, do primeiro atendimento ao relatório final
        </h2>

        {/* Step indicators */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {CAROUSEL_SLIDES.map((s, i) => (
            <button key={i} onClick={() => go(i)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
              style={{
                backgroundColor: i === current ? s.bg : "#fff",
                color: i === current ? s.color : "#9CA3AF",
                border: `2px solid ${i === current ? s.color : "#F3F4F6"}`,
                transform: i === current ? "scale(1.05)" : "scale(1)",
              }}>
              <span>{s.icon}</span>
              {s.title}
            </button>
          ))}
        </div>

        {/* Slide content */}
        <div
          className="max-w-2xl mx-auto rounded-3xl p-10 md:p-14 text-center transition-all duration-500"
          style={{ backgroundColor: slide.bg, minHeight: 220 }}>
          <div className="text-6xl mb-6">{slide.icon}</div>
          <h3 style={{ fontFamily: poppins, fontWeight: 700, fontSize: 24, color: "#1D3557", marginBottom: 12 }}>{slide.title}</h3>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#4B5563", fontFamily: inter }}>{slide.desc}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              className="rounded-full transition-all duration-300"
              style={{ height: 8, width: i === current ? 28 : 8, backgroundColor: i === current ? "#1D3557" : "#D1D5DB" }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Indique ao terapeuta ─────────────────────────────────────────────────────

function ReferralSection() {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText("https://www.acompanhamentogirassol.com.br").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const waMsg = encodeURIComponent(
    "Oi! Seu terapeuta usa o Acompanhamento Girassol para compartilhar evoluções e o desenvolvimento do seu familiar com você. Acesse www.acompanhamentogirassol.com.br e clique em CRIE SUA CONTA para começar a acompanhar gratuitamente."
  );

  return (
    <section id="sobre" style={{ backgroundColor: "#fff", paddingTop: 96, paddingBottom: 96, fontFamily: inter }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10 text-center flex flex-col items-center gap-8">
        <div>
          <h2 style={{ fontFamily: poppins, fontSize: "clamp(26px,2.8vw,36px)", fontWeight: 700, color: "#1D3557", marginBottom: 12 }}>
            Conhece um terapeuta incrível? Apresente o Girassol a ele.
          </h2>
          <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.7 }}>
            Mande uma mensagem rápida e ajude mais famílias a terem esse acompanhamento.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
          <a
            href={`https://wa.me/?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ backgroundColor: "#25D366" }}>
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Indicar pelo WhatsApp
          </a>
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold border-2 transition-all hover:bg-gray-50"
            style={{ borderColor: copied ? "#4CAF50" : "#1D3557", color: copied ? "#4CAF50" : "#1D3557" }}>
            {copied ? (
              <>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Link copiado!
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copiar link para indicar
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Nossa História ───────────────────────────────────────────────────────────

function NossaHistoriaSection() {
  return (
    <section id="nossa-historia" style={{ backgroundColor: "#FFF7E6", paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: "#FFFBEB", color: "#E07B29" }}
          >
            Nossa história
          </span>
          <h2 style={{ fontFamily: poppins, fontSize: "clamp(28px,3vw,40px)", fontWeight: 700, color: "#1D3557", lineHeight: 1.2 }}>
            Como uma fisioterapeuta do interior do Ceará transformou uma inquietação em plataforma
          </h2>
        </div>

        <div className="max-w-3xl mx-auto flex flex-col gap-12">

          {/* O que é */}
          <div>
            <h3 style={{ fontFamily: poppins, fontWeight: 700, fontSize: 22, color: "#1D3557", marginBottom: 14 }}>
              O que é a Plataforma
            </h3>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#4B5563", fontFamily: inter }}>
              O Acompanhamento Girassol é uma plataforma criada para fortalecer o vínculo entre terapeuta, paciente e família. Aqui, cada sessão, cada evolução e cada conquista são registradas com cuidado, formando um histórico vivo do percurso terapêutico.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#4B5563", fontFamily: inter, marginTop: 14 }}>
              A proposta é simples: tornar o processo terapêutico mais transparente, humano e conectado, para que ninguém precise caminhar sozinho nessa jornada.
            </p>
          </div>

          {/* Como surgiu */}
          <div>
            <h3 style={{ fontFamily: poppins, fontWeight: 700, fontSize: 22, color: "#1D3557", marginBottom: 14 }}>
              Como surgiu
            </h3>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#4B5563", fontFamily: inter }}>
              Entre um atendimento e outro, no ritmo acelerado da rotina clínica, a Fisioterapeuta Thaís Freitas percebia algo que a movia: havia muito mais a oferecer do que o tempo permitia. Terapeutas com o coração cheio de coisas importantes para compartilhar, famílias igualmente ansiosas por participar mais ativamente, e uma equipe multidisciplinar que, apesar do comprometimento, encontrava poucos momentos para trocar informações que poderiam transformar um tratamento.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#4B5563", fontFamily: inter, marginTop: 14 }}>
              Cada detalhe que não chegava à família, cada observação que não alcançava o colega de equipe, representava uma oportunidade de impulsionar ainda mais o desenvolvimento do paciente. E para a Dra. Thaís Freitas, enxergar uma oportunidade de melhorar a vida de alguém e não agir simplesmente não era uma opção.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#4B5563", fontFamily: inter, marginTop: 14 }}>
              Ela foi além. Buscou um desenvolvedor que acreditasse no mesmo sonho, e juntos construíram o Acompanhamento Girassol, uma plataforma pensada de dentro para fora, nascida da vivência real de quem está presente em cada sessão, todos os dias.
            </p>
          </div>

          {/* Quem é Thaís */}
          <div>
            <h3 style={{ fontFamily: poppins, fontWeight: 700, fontSize: 22, color: "#1D3557", marginBottom: 18 }}>
              Quem é Thaís Freitas
            </h3>

            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Foto-Thais.jpeg"
                alt="Thaís Freitas"
                className="w-32 h-32 rounded-2xl object-cover object-top flex-shrink-0 self-start"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div style={{ fontFamily: inter }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#1D3557" }}>Thaís Emanuelle Martins de Freitas</p>
                <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>Fisioterapeuta · Especialista em Psicomotricidade · Idealizadora do Acompanhamento Girassol</p>
                <a
                  href="https://www.instagram.com/thaisfreitasfisio"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#E1306C", marginTop: 8, textDecoration: "none", fontFamily: inter }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @thaisfreitasfisio
                </a>
              </div>
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#4B5563", fontFamily: inter }}>
              Nascida em Mossoró, no Rio Grande do Norte, Thaís cresceu em Aracati, no interior do Ceará, cidade que escolheu para chamar de lar até hoje. Fisioterapeuta especializada em psicomotricidade, carregou desde cedo uma certeza: cuidar do outro é mais do que uma profissão, é um propósito.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#4B5563", fontFamily: inter, marginTop: 14 }}>
              Foi na psicomotricidade que encontrou o que tanto buscava. Uma prática que enxerga a criança por inteiro: seu movimento, suas emoções, sua história. Uma abordagem onde cada detalhe é valorizado, e cada pequena conquista é celebrada como o grande avanço que realmente é.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#4B5563", fontFamily: inter, marginTop: 14 }}>
              Mãe, esposa e profissional apaixonada pelo que faz, a Dra. Thaís une na vida aquilo que vive na clínica: presença, atenção e cuidado genuíno. O Acompanhamento Girassol nasceu de tudo isso, de suas experiências, de sua sensibilidade e da crença inabalável de que a tecnologia pode, sim, servir ao cuidado humano.
            </p>
            <blockquote
              style={{ borderLeft: "4px solid #FFBA3D", paddingLeft: 20, marginTop: 28, fontStyle: "italic", fontSize: 16, lineHeight: 1.8, color: "#6B7280", fontFamily: inter }}
            >
              &ldquo;Não fui desenvolvedora, não fui programadora. Fui apenas uma terapeuta que acreditou que era possível fazer diferente e ajudar meus colegas de profissão e, principalmente, o desenvolvimento dos meus pacientes.&rdquo;
            </blockquote>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Depoimentos ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { text: "Antes eu perdia horas em planilha e caderno. Hoje tudo fica registrado em minutos e os pais adoram receber as evoluções.", name: "Ana Paula", role: "Fisioterapeuta", color: "#4CAF50", initial: "A" },
  { text: "A família do meu paciente começou a participar muito mais depois que passou a ver as sessões pelo Girassol. Fez toda a diferença no resultado.", name: "Carla", role: "Terapeuta Ocupacional", color: "#8E6CCF", initial: "C" },
  { text: "Nunca pensei que ia conseguir organizar minha agenda, financeiro e evoluções em um só lugar. É simples, bonito e completo.", name: "Rafael", role: "Psicomotricista", color: "#2E7BC1", initial: "R" },
];

function TestimonialsSection() {
  return (
    <section id="depoimentos" style={{ backgroundColor: "#1D3557", paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <h2 className="text-center mb-14"
          style={{ fontFamily: poppins, fontSize: "clamp(28px,3vw,40px)", fontWeight: 700, color: "#fff" }}>
          Quem usa, não abre mão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name}
              className="rounded-2xl p-8 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "#fff", fontFamily: inter }}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4" fill="#FFBA3D" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "#374151", flex: 1 }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "#F3F4F6" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: t.color }}>
                  {t.initial}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D3557" }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

const KPIS = [
  { value: "+1.500", label: "Famílias conectadas" },
  { value: "+50", label: "Terapeutas parceiros" },
  { value: "+10 mil", label: "Sessões acompanhadas" },
  { value: "+20", label: "Especialidades atendidas" },
];

function KpisSection() {
  return (
    <section style={{ backgroundColor: "#FFC107", paddingTop: 72, paddingBottom: 72 }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {KPIS.map((k) => (
            <div key={k.label} className="flex flex-col gap-2">
              <span style={{ fontFamily: poppins, fontWeight: 700, fontSize: "clamp(36px,4vw,48px)", color: "#1D3557" }}>
                {k.value}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1D3557", opacity: 0.75, fontFamily: inter }}>
                {k.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "O Girassol é para terapeutas ou para famílias?",
    a: "É uma plataforma para terapeutas e clínicas. As famílias têm acesso gratuito para acompanhar o desenvolvimento do filho.",
  },
  {
    q: "Preciso instalar algum aplicativo?",
    a: "Não. O Girassol funciona direto no navegador, no celular ou computador, sem instalação.",
  },
  {
    q: "Como funciona o período gratuito?",
    a: "Você tem 30 dias para testar tudo sem precisar de cartão de crédito. Se gostar, escolhe o plano ideal para sua prática.",
  },
  {
    q: "Meus dados e os dos meus pacientes estão seguros?",
    a: "Sim. Usamos criptografia e seguimos todas as normas da LGPD para proteger as informações.",
  },
  {
    q: "Posso usar em mais de uma clínica?",
    a: "Sim. O Girassol permite gerenciar atendimentos em diferentes clínicas dentro de uma única conta.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden border transition-all duration-200"
      style={{ borderColor: open ? "#4CAF50" : "#F3F4F6", backgroundColor: "#fff" }}>
      <button
        className="w-full flex items-center justify-between gap-4 px-7 py-5 text-left"
        onClick={() => setOpen(!open)}>
        <span style={{ fontFamily: poppins, fontWeight: 600, fontSize: 16, color: "#1D3557" }}>{q}</span>
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ backgroundColor: open ? "#4CAF50" : "#F3F4F6", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" stroke={open ? "#fff" : "#4B5563"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? 200 : 0 }}>
        <p className="px-7 pb-6" style={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", fontFamily: inter }}>{a}</p>
      </div>
    </div>
  );
}

function FAQSection() {
  return (
    <section id="contato" style={{ backgroundColor: "#fff", paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10">
        <h2 className="text-center mb-12"
          style={{ fontFamily: poppins, fontSize: "clamp(28px,3vw,40px)", fontWeight: 700, color: "#1D3557" }}>
          Perguntas frequentes
        </h2>
        <div className="flex flex-col gap-4">
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────

function CTASection({ openLogin }: { openLogin: () => void }) {
  return (
    <section style={{ backgroundColor: "#FFF7E6", paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-2xl mx-auto px-6 md:px-10 text-center flex flex-col items-center gap-7">
        <h2 style={{ fontFamily: poppins, fontSize: "clamp(30px,3.5vw,44px)", fontWeight: 700, color: "#1D3557", lineHeight: 1.2 }}>
          Pronto para transformar sua prática?
        </h2>
        <p style={{ fontSize: 18, color: "#4B5563", lineHeight: 1.7, fontFamily: inter }}>
          Comece grátis por 30 dias. Sem cartão de crédito, sem complicação.
        </p>
        <Link href="/cadastro"
          className="px-12 py-4 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ backgroundColor: "#4CAF50" }}>
          Criar minha conta agora
        </Link>
        <button
          onClick={openLogin}
          className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-60"
          style={{ color: "#6B7280", fontFamily: inter, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
          Já tenho conta. Quero entrar.
        </button>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_COLS = [
  {
    title: "Produto",
    links: [
      { label: "Funcionalidades", href: "#funcionalidades" },
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Para famílias", href: "#familias" },
      { label: "Preços", href: "#precos" },
    ],
  },
  {
    title: "Para quem é",
    links: [
      { label: "Fisioterapeutas", href: "#" },
      { label: "Fonoaudiólogos", href: "#" },
      { label: "Psicólogos", href: "#" },
      { label: "Clínicas", href: "#" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "Perguntas frequentes", href: "#contato" },
      { label: "Central de ajuda", href: "#" },
      { label: "Contato", href: "#contato" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "#" },
      { label: "Termos de uso", href: "#" },
      { label: "LGPD", href: "#" },
    ],
  },
];

function Footer() {
  return (
    <footer style={{ backgroundColor: "#1D3557", paddingTop: 64, paddingBottom: 32, fontFamily: inter }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-12 border-b" style={{ borderColor: "#2D4A6B" }}>
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/identidade-visual/Logo-Nome-Slogan.png"
              alt="Acompanhamento Girassol"
              style={{ height: 56, filter: "brightness(0) invert(1)", objectFit: "contain", objectPosition: "left" }}
            />
            <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>
              Cuidar, acompanhar, evoluir juntos.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-1">
              {[
                { label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                { label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
              ].map((s) => (
                <a key={s.label} href="#" aria-label={s.label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ backgroundColor: "#2D4A6B" }}>
                  <svg className="w-4 h-4" fill="#94A3B8" viewBox="0 0 24 24">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {col.title}
              </span>
              {col.links.map((l) => (
                <a key={l.label} href={l.href}
                  className="transition-opacity hover:opacity-60"
                  style={{ fontSize: 14, color: "#94A3B8" }}>
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p style={{ fontSize: 13, color: "#64748B" }}>
            Acompanhamento Girassol &copy; {new Date().getFullYear()}. Todos os direitos reservados.
          </p>
          <div className="flex gap-5">
            <a href="#" className="transition-opacity hover:opacity-60" style={{ fontSize: 13, color: "#64748B" }}>Privacidade</a>
            <a href="#" className="transition-opacity hover:opacity-60" style={{ fontSize: 13, color: "#64748B" }}>Termos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Login Dropdown ───────────────────────────────────────────────────────────

function LoginDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

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
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none",
    boxSizing: "border-box", backgroundColor: "#fff", color: "#111827",
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: 160,
        right: 24,
        width: 320,
        backgroundColor: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        padding: "24px 24px 20px",
        zIndex: 9999,
        fontFamily: inter,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#1D3557" }}>Entrar na sua conta</span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9CA3AF", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          aria-label="Fechar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          <p style={{ fontSize: 12, color: "#DC2626", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "11px 0", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer", backgroundColor: "#1D3557", color: "#fff", fontWeight: 700, fontSize: 14, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <Link
          href="/recuperar-senha"
          style={{ fontSize: 12, color: "#6B7280", textAlign: "center", textDecoration: "none" }}
        >
          Esqueci minha senha
        </Link>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
        <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>ou</span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
      </div>

      <button
        onClick={handleGoogle}
        type="button"
        style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1.5px solid #E5E7EB", cursor: "pointer", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#1D3557" }}
      >
        <GoogleIcon />
        Continuar com Google
      </button>

      <p style={{ textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 16, marginBottom: 0 }}>
        Ainda não tem conta?{" "}
        <Link href="/cadastro" style={{ color: "#1D3557", fontWeight: 700, textDecoration: "none" }}>
          Crie aqui
        </Link>
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const openLogin = () => setLoginOpen(true);

  return (
    <>
      {loginOpen && <LoginDropdown onClose={() => setLoginOpen(false)} />}
      <NavBar openLogin={openLogin} />
      <main>
        <HeroSection openLogin={openLogin} />
        <SpecialtiesBanner />
        <FeaturesSection />
        <FamilySection />
        <CarouselSection />
        <ReferralSection />
        <NossaHistoriaSection />
        <TestimonialsSection />
        <KpisSection />
        <FAQSection />
        <CTASection openLogin={openLogin} />
      </main>
      <Footer />
    </>
  );
}

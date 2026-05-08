"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Início", href: "#inicio" },
  { label: "Sobre nós", href: "#sobre" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Contato", href: "#contato" },
];

const FEATURES = [
  {
    color: "#4CAF50", bg: "#F0FFF4",
    label: "Acompanhamento em tempo real",
    desc: "Veja a evolução do seu filho em tempo real, com registros de cada sessão.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    color: "#8E6CCF", bg: "#F3F0FF",
    label: "Comunicação facilitada",
    desc: "Canal direto entre família e terapeuta com mensagens e notificações.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    color: "#D97706", bg: "#FFFBEB",
    label: "Relatórios e devolutivas",
    desc: "Relatórios detalhados das sessões compartilhados com a família de forma simples.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    color: "#2E7BC1", bg: "#EFF6FF",
    label: "Atividades em casa",
    desc: "Receba sugestões de atividades para continuar o desenvolvimento no lar.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    color: "#FF5C7A", bg: "#FFF0F3",
    label: "Mais vínculo, mais resultados",
    desc: "Família presente + terapeuta dedicado = transformação real e duradoura.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

const KPIS = [
  { value: "+1.500", label: "Famílias conectadas", color: "#4CAF50", bg: "#F0FFF4" },
  { value: "+50", label: "Terapeutas parceiros", color: "#2E7BC1", bg: "#EFF6FF" },
  { value: "+10 mil", label: "Sessões acompanhadas", color: "#D97706", bg: "#FFFBEB" },
  { value: "+20", label: "Especialidades", color: "#FF5C7A", bg: "#FFF0F3" },
];

const STEPS = [
  { n: "01", title: "Terapeuta cadastra-se", desc: "O profissional cria sua conta, configura seus atendimentos e convida as famílias.", color: "#4CAF50" },
  { n: "02", title: "Família acompanha", desc: "Os responsáveis recebem acesso e visualizam evoluções, atividades e relatórios em tempo real.", color: "#8E6CCF" },
  { n: "03", title: "Resultados aparecem", desc: "Com comunicação fluida e acompanhamento constante, o desenvolvimento da criança acelera.", color: "#FFBA3D" },
];

const AVATARS = [
  { bg: "#4CAF50", l: "M" }, { bg: "#8E6CCF", l: "A" },
  { bg: "#2E7BC1", l: "C" }, { bg: "#FF5C7A", l: "L" },
];

// ─── NavBar ───────────────────────────────────────────────────────────────────

function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/identidade-visual/Logo-Nome-Slogan.png" alt="Acompanhamento Girassol"
            style={{ height: 44, width: "auto" }} />
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-[#1D3557] transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <Link href="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#1D3557", color: "#1D3557" }}>
            Entrar
          </Link>
          <Link href="/cadastro"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1D3557" }}>
            Cadastre-se
          </Link>
        </div>

        <button onClick={() => setOpen(!open)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: "#1D3557" }}>
          {open
            ? <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          }
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-2">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block text-sm font-medium text-gray-700 py-2 hover:text-[#1D3557] transition-colors">
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            <Link href="/login" onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 text-center"
              style={{ borderColor: "#1D3557", color: "#1D3557" }}>
              Entrar
            </Link>
            <Link href="/cadastro" onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#1D3557" }}>
              Cadastre-se
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section id="inicio" style={{ backgroundColor: "#FFF7E6" }} className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left */}
        <div className="relative z-10 order-2 lg:order-1">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor: "#4CAF50", color: "#fff" }}>
            Para famílias e terapeutas
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Acompanhe cada conquista do seu filho,{" "}
            <span style={{ color: "#8E6CCF" }}>onde você estiver.</span>
          </h1>
          <p className="text-base lg:text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
            Conectamos famílias e terapeutas para um acompanhamento completo, prático e cheio de significado.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <Link href="/login"
              className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1D3557" }}>
              Entrar
            </Link>
            <Link href="/cadastro"
              className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FFBA3D", color: "#1D3557" }}>
              Cadastre-se grátis
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {AVATARS.map((a, i) => (
                <div key={i}
                  className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: a.bg }}>
                  {a.l}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              <strong style={{ color: "#1D3557" }}>+1.500 famílias</strong> já transformam o acompanhamento em resultados reais.
            </p>
          </div>
        </div>

        {/* Right — illustration */}
        <div className="relative flex justify-center lg:justify-end order-1 lg:order-2">
          {/* Decorative */}
          <div className="absolute -top-4 left-4 pointer-events-none" aria-hidden>
            <svg width="30" height="38" viewBox="0 0 26 32" fill="none">
              <path d="M13 2C13 2 24 9 24 18C24 25 19.5 30 13 30C6.5 30 2 25 2 18C2 9 13 2 13 2Z" fill="#4CAF50" opacity="0.7"/>
              <line x1="13" y1="4" x2="13" y2="28" stroke="#2E7D32" strokeWidth="1.2" strokeOpacity="0.4"/>
            </svg>
          </div>
          <div className="absolute top-8 right-4 pointer-events-none" aria-hidden>
            <svg width="24" height="22" viewBox="0 0 22 20" fill="none">
              <path d="M11 18L2.5 10C0.5 8 0.5 5 2.5 3.5C4.5 2 7 2.5 8.5 4.5L11 7L13.5 4.5C15 2.5 17.5 2 19.5 3.5C21.5 5 21.5 8 19.5 10Z"
                stroke="#8E6CCF" strokeWidth="1.8" strokeDasharray="3 2" fill="none"/>
            </svg>
          </div>
          <div className="absolute bottom-10 left-0 pointer-events-none" aria-hidden>
            <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
              {[0,72,144,216,288].map((r, i) => (
                <ellipse key={i} cx="16" cy="6" rx="3.5" ry="6" fill="#FFBA3D" opacity="0.6" transform={`rotate(${r} 16 16)`}/>
              ))}
              <circle cx="16" cy="16" r="3.5" fill="#FFBA3D" opacity="0.6"/>
            </svg>
          </div>
          <div className="absolute -bottom-2 right-0 pointer-events-none" aria-hidden>
            <svg width="48" height="24" viewBox="0 0 40 20" fill="none">
              <path d="M0 20C0 9 9 0 20 0C31 0 40 9 40 20Z" fill="#1D3557" opacity="0.6"/>
            </svg>
          </div>

          <div className="relative w-full max-w-md">
            {/* Main card */}
            <div className="rounded-3xl shadow-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #E9E4F8 0%, #C7D2FE 60%, #DDD6FE 100%)", minHeight: 320 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/identidade-visual/familia.svg" alt="Família conectada"
                className="w-full object-contain"
                style={{ minHeight: 280, padding: "24px 32px" }} />
            </div>

            {/* Floating card — security */}
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3"
              style={{ maxWidth: 220 }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#F0FFF4" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#4CAF50" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "#1D3557" }}>Seguro e confiável</p>
                <p className="text-[11px] leading-snug" style={{ color: "#6B7280" }}>Dados com criptografia e privacidade garantida</p>
              </div>
            </div>

            {/* Floating card — activity */}
            <div className="absolute -top-5 -right-3 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#F3F0FF" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#8E6CCF" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "#8E6CCF" }}>Nova evolução</p>
                <p className="text-[11px]" style={{ color: "#9CA3AF" }}>há 2 minutos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Strip ───────────────────────────────────────────────────────────

function FeaturesStrip() {
  return (
    <section id="funcionalidades" className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#4CAF50" }}>Funcionalidades</p>
          <h2 className="text-3xl lg:text-4xl font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Tudo que família e terapeuta precisam
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm lg:text-base">
            Uma plataforma completa para que nada se perca entre a sessão e o lar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {FEATURES.map((f) => (
            <div key={f.label}
              className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-default">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: f.bg, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="text-sm font-bold leading-snug" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
                {f.label}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mission / Sobre ──────────────────────────────────────────────────────────

function MissionSection() {
  return (
    <section id="sobre" style={{ backgroundColor: "#FFF7E6" }} className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#4CAF50" }}>Nossa missão</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-snug mb-5"
            style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Você não está sozinho(a).{" "}
            <span style={{ color: "#8E6CCF" }}>Estamos aqui para caminhar com você.</span>
          </h2>
          <div className="space-y-4 text-gray-600 text-sm lg:text-base leading-relaxed">
            <p>
              O <strong style={{ color: "#1D3557" }}>Acompanhamento Girassol</strong> nasceu da crença de que o desenvolvimento de uma criança floresce quando família e terapeuta caminham juntos — com comunicação clara, presença constante e amor.
            </p>
            <p>
              Nossa plataforma elimina as barreiras entre consultório e lar, tornando cada evolução visível e cada conquista celebrada em família.
            </p>
            <p>
              Como um girassol que sempre busca a luz, apoiamos famílias e profissionais na jornada de transformação — sessão a sessão, dia a dia.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/cadastro"
              className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#4CAF50" }}>
              Começar agora — é grátis
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-2xl p-6 flex flex-col gap-1" style={{ backgroundColor: k.bg }}>
              <span className="text-3xl font-bold" style={{ color: k.color, fontFamily: "var(--font-poppins, sans-serif)" }}>
                {k.value}
              </span>
              <span className="text-sm font-medium text-gray-600">{k.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#4CAF50" }}>Como funciona</p>
          <h2 className="text-3xl lg:text-4xl font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Simples, rápido e humano
          </h2>
          <p className="text-gray-500 mt-3 text-sm lg:text-base max-w-lg mx-auto">
            Em três passos você já está conectado e acompanhando cada evolução.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-5 shadow-sm"
                style={{ backgroundColor: s.color, fontFamily: "var(--font-poppins, sans-serif)" }}>
                {s.n}
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
                {s.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section style={{ backgroundColor: "#1D3557" }} className="py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#4CAF50" }} />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: "#FFBA3D" }} />
      <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#FFBA3D" }}>Comece hoje mesmo</p>
        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-5"
          style={{ fontFamily: "var(--font-poppins, sans-serif)" }}>
          Faça parte dessa jornada
        </h2>
        <p className="text-base lg:text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "#CBD5E1" }}>
          Junte-se a mais de 1.500 famílias que já descobriram como o acompanhamento pode ser mais próximo, mais humano e mais eficaz.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/login"
            className="px-7 py-3.5 rounded-xl text-sm font-bold border-2 border-white text-white transition-colors hover:bg-white hover:text-[#1D3557]">
            Entrar
          </Link>
          <Link href="/cadastro"
            className="px-7 py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFBA3D", color: "#1D3557" }}>
            Cadastre-se — é grátis
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100" id="contato">
      <div className="max-w-7xl mx-auto px-5 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/identidade-visual/Logo-Nome-Slogan.png" alt="Acompanhamento Girassol"
            style={{ height: 52, width: "auto", marginBottom: 12 }} />
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            Conectamos famílias e terapeutas para um acompanhamento completo, prático e cheio de significado.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Plataforma</p>
          <ul className="space-y-2.5">
            {[
              { l: "Sobre nós", h: "#sobre" },
              { l: "Funcionalidades", h: "#funcionalidades" },
              { l: "Como funciona", h: "#como-funciona" },
            ].map((x) => (
              <li key={x.l}><a href={x.h} className="text-sm text-gray-600 hover:text-[#1D3557] transition-colors">{x.l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Legal</p>
          <ul className="space-y-2.5">
            {["Privacidade", "Termos de uso", "Contato"].map((l) => (
              <li key={l}><a href="#contato" className="text-sm text-gray-600 hover:text-[#1D3557] transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-5 px-5">
        <p className="text-center text-xs text-gray-400">
          Acompanhamento Girassol © {new Date().getFullYear()} — Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
      <NavBar />
      <main>
        <HeroSection />
        <FeaturesStrip />
        <MissionSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── NavBar ───────────────────────────────────────────────────────────────────

function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
      style={{ height: 64, backgroundColor: "#FFF7E6", borderBottom: "1px solid #FDE68A" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/identidade-visual/Logo-Nome-Slogan.png" alt="Acompanhamento Girassol" style={{ height: 40 }} />
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        <a href="#como-funciona" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: "#1D3557" }}>Como funciona</a>
        <a href="#familias" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: "#1D3557" }}>Para famílias</a>
        <a href="#depoimentos" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: "#1D3557" }}>Depoimentos</a>
      </nav>

      {/* Desktop CTAs */}
      <div className="hidden md:flex items-center gap-3">
        <Link href="/login"
          className="px-5 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
          style={{ borderColor: "#1D3557", color: "#1D3557" }}>
          Entrar
        </Link>
        <Link href="/cadastro"
          className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#1D3557" }}>
          Criar conta grátis
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <span className={`block w-5 h-0.5 transition-all ${open ? "rotate-45 translate-y-2" : ""}`} style={{ backgroundColor: "#1D3557" }} />
        <span className={`block w-5 h-0.5 transition-all ${open ? "opacity-0" : ""}`} style={{ backgroundColor: "#1D3557" }} />
        <span className={`block w-5 h-0.5 transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} style={{ backgroundColor: "#1D3557" }} />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="absolute top-16 left-0 right-0 flex flex-col gap-1 px-6 py-5 md:hidden shadow-lg z-50"
          style={{ backgroundColor: "#FFF7E6", borderBottom: "1px solid #FDE68A" }}>
          <a href="#como-funciona" onClick={() => setOpen(false)} className="py-2 text-sm font-medium" style={{ color: "#1D3557" }}>Como funciona</a>
          <a href="#familias" onClick={() => setOpen(false)} className="py-2 text-sm font-medium" style={{ color: "#1D3557" }}>Para famílias</a>
          <a href="#depoimentos" onClick={() => setOpen(false)} className="py-2 text-sm font-medium" style={{ color: "#1D3557" }}>Depoimentos</a>
          <div className="flex flex-col gap-2 pt-3">
            <Link href="/login" onClick={() => setOpen(false)}
              className="py-2.5 rounded-xl text-sm font-semibold text-center border"
              style={{ borderColor: "#1D3557", color: "#1D3557" }}>
              Entrar
            </Link>
            <Link href="/cadastro" onClick={() => setOpen(false)}
              className="py-2.5 rounded-xl text-sm font-bold text-white text-center"
              style={{ backgroundColor: "#1D3557" }}>
              Criar conta grátis
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
    <section
      id="inicio"
      className="flex items-center"
      style={{ backgroundColor: "#FFF7E6", paddingTop: 64, minHeight: "100vh" }}
    >
      <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div className="flex flex-col gap-6">
          <span
            className="inline-flex self-start items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#4CAF50", color: "#fff" }}
          >
            Para terapeutas e clínicas
          </span>

          <h1
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
          >
            Gerencie seus pacientes e encante as famílias, tudo em um só lugar.
          </h1>

          <p className="text-base md:text-lg leading-relaxed" style={{ color: "#4B5563" }}>
            O Acompanhamento Girassol conecta você às famílias dos seus pacientes com organização, clareza e muito cuidado.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/cadastro"
              className="px-7 py-3.5 rounded-xl text-sm font-bold text-white text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1D3557" }}>
              Quero conhecer
            </Link>
            <Link href="/login"
              className="px-7 py-3.5 rounded-xl text-sm font-semibold text-center border transition-colors hover:bg-white"
              style={{ borderColor: "#1D3557", color: "#1D3557" }}>
              Já tenho conta
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-2">
              {["#8E6CCF", "#4CAF50", "#2E7BC1", "#FFBA3D"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: c }}>
                  {["F", "T", "A", "M"][i]}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>
              <span className="font-bold" style={{ color: "#1D3557" }}>+50 terapeutas</span> já usam o Girassol
            </p>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/identidade-visual/hero-home.png"
            alt="Terapeuta com paciente"
            className="w-full max-w-md md:max-w-full rounded-2xl object-cover"
            style={{ maxHeight: 520 }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Como funciona ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "/identidade-visual/agenda.svg",
    color: "#4CAF50",
    bg: "#F0FFF4",
    title: "Agenda inteligente",
    desc: "Organize seus atendimentos sem confusão. Tudo no lugar certo, sempre.",
  },
  {
    icon: "/identidade-visual/evolucoes.svg",
    color: "#8E6CCF",
    bg: "#F5F3FF",
    title: "Registro de evoluções",
    desc: "Documente cada sessão de forma rápida e profissional.",
  },
  {
    icon: "/identidade-visual/financeiro.svg",
    color: "#FFBA3D",
    bg: "#FFFBEB",
    title: "Financeiro simplificado",
    desc: "Controle pagamentos, faltas e receitas sem planilha.",
  },
  {
    icon: "/identidade-visual/mensagem.svg",
    color: "#2E7BC1",
    bg: "#EFF6FF",
    title: "Comunicação com a família",
    desc: "Envie orientações e atualizações diretamente para os pais.",
  },
];

function HowItWorksSection() {
  return (
    <section id="como-funciona" style={{ backgroundColor: "#fff", paddingTop: 80, paddingBottom: 80 }}>
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
          >
            Tudo que você precisa para uma prática organizada e humanizada
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-7 flex flex-col gap-4"
              style={{ backgroundColor: f.bg }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: f.color + "22" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.icon} alt={f.title} className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Carrossel ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: "📋",
    title: "Evolução após cada sessão",
    desc: "A família recebe um resumo detalhado do que aconteceu na sessão, celebrando cada pequeno avanço junto com você.",
  },
  {
    icon: "🏠",
    title: "Atividades para fazer em casa",
    desc: "Você envia orientações práticas para os pais colocarem em prática no dia a dia, ampliando os resultados da terapia.",
  },
  {
    icon: "💬",
    title: "Comunicação direta com o terapeuta",
    desc: "Pais podem tirar dúvidas e compartilhar observações diretamente com você, fortalecendo o vínculo terapêutico.",
  },
  {
    icon: "📈",
    title: "Histórico completo do desenvolvimento",
    desc: "Todo o percurso do paciente registrado em um só lugar. Fácil de acompanhar, fácil de compartilhar.",
  },
];

function Carousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function go(idx: number) {
    setCurrent((idx + SLIDES.length) % SLIDES.length);
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => go(current + 1), 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const slide = SLIDES[current];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Slide */}
      <div
        className="rounded-2xl p-8 md:p-10 flex flex-col gap-5 text-center"
        style={{ backgroundColor: "#F5F3FF", minHeight: 220 }}
      >
        <div className="text-5xl">{slide.icon}</div>
        <h3
          className="text-xl font-bold"
          style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
        >
          {slide.title}
        </h3>
        <p className="text-sm md:text-base leading-relaxed" style={{ color: "#4B5563" }}>
          {slide.desc}
        </p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="rounded-full transition-all"
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              backgroundColor: i === current ? "#8E6CCF" : "#D1D5DB",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Famílias ─────────────────────────────────────────────────────────────────

function FamiliesSection() {
  return (
    <section id="familias" style={{ backgroundColor: "#fff", paddingTop: 80, paddingBottom: 80 }}>
      <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col items-center gap-12">
        <div className="text-center max-w-2xl">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor: "#F5F3FF", color: "#8E6CCF" }}
          >
            O diferencial que faz a diferença
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold mb-5"
            style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
          >
            Seus pacientes evoluem mais quando a família participa
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "#4B5563" }}>
            Após cada sessão, a família recebe um resumo completo da evolução, orientações para praticar em casa e pode conversar diretamente com você. Mais vínculo, mais resultado.
          </p>
        </div>

        <Carousel />

        <Link
          href="/cadastro"
          className="px-8 py-3.5 rounded-xl text-sm font-bold border-2 transition-colors hover:bg-green-50"
          style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
        >
          Indique o Girassol ao seu terapeuta ou clínica
        </Link>
      </div>
    </section>
  );
}

// ─── Depoimentos ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    text: "Antes eu perdia horas em planilha e caderno. Hoje tudo fica registrado em minutos e os pais adoram receber as evoluções.",
    role: "Fisioterapeuta",
    color: "#4CAF50",
    bg: "#F0FFF4",
    initial: "A",
  },
  {
    text: "A família do meu paciente começou a participar muito mais depois que passou a ver as sessões pelo Girassol. Fez toda a diferença.",
    role: "Terapeuta Ocupacional",
    color: "#8E6CCF",
    bg: "#F5F3FF",
    initial: "R",
  },
  {
    text: "Nunca pensei que ia conseguir organizar minha agenda, financeiro e evoluções em um só lugar. É simples e bonito.",
    role: "Psicomotricista",
    color: "#2E7BC1",
    bg: "#EFF6FF",
    initial: "C",
  },
];

function TestimonialsSection() {
  return (
    <section id="depoimentos" style={{ backgroundColor: "#FFF7E6", paddingTop: 80, paddingBottom: 80 }}>
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
        >
          Quem usa, não abre mão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.role} className="rounded-2xl p-7 flex flex-col gap-5" style={{ backgroundColor: t.bg }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initial}
                </div>
                <span className="text-sm font-semibold" style={{ color: "#1D3557" }}>{t.role}</span>
              </div>
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4" fill="#FFBA3D" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed italic" style={{ color: "#374151" }}>
                &ldquo;{t.text}&rdquo;
              </p>
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
  { value: "+20", label: "Especialidades" },
];

function KpisSection() {
  return (
    <section style={{ backgroundColor: "#1D3557", paddingTop: 64, paddingBottom: 64 }}>
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {KPIS.map((k) => (
            <div key={k.label} className="flex flex-col gap-2">
              <span
                className="text-4xl md:text-5xl font-bold"
                style={{ color: "#FFBA3D", fontFamily: "var(--font-poppins, sans-serif)" }}
              >
                {k.value}
              </span>
              <span className="text-sm md:text-base font-medium" style={{ color: "#CBD5E1" }}>
                {k.label}
              </span>
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
    <section style={{ backgroundColor: "#FFF7E6", paddingTop: 80, paddingBottom: 80 }}>
      <div className="max-w-2xl mx-auto px-6 md:px-12 text-center flex flex-col items-center gap-6">
        <h2
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
        >
          Pronto para transformar sua prática?
        </h2>
        <p className="text-base md:text-lg" style={{ color: "#4B5563" }}>
          Comece grátis por 30 dias. Sem cartão de crédito, sem complicação.
        </p>
        <Link
          href="/cadastro"
          className="px-10 py-4 rounded-xl text-base font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#4CAF50" }}
        >
          Criar minha conta agora
        </Link>
        <Link href="/login" className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70" style={{ color: "#6B7280" }}>
          Já tenho conta. Quero entrar.
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ backgroundColor: "#1D3557", paddingTop: 48, paddingBottom: 32 }}>
      <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        {/* Logo + tagline */}
        <div className="flex flex-col items-center md:items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/identidade-visual/Logo-Nome-Slogan.png" alt="Acompanhamento Girassol" style={{ height: 44, filter: "brightness(0) invert(1)" }} />
          <p className="text-xs text-center md:text-left" style={{ color: "#94A3B8" }}>
            Cuidar, acompanhar, evoluir juntos.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-8 text-sm">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <span className="font-semibold mb-1" style={{ color: "#F1F5F9" }}>Plataforma</span>
            <Link href="/login" className="hover:opacity-70 transition-opacity" style={{ color: "#94A3B8" }}>Entrar</Link>
            <Link href="/cadastro" className="hover:opacity-70 transition-opacity" style={{ color: "#94A3B8" }}>Criar conta</Link>
          </div>
          <div className="flex flex-col gap-2 items-center md:items-start">
            <span className="font-semibold mb-1" style={{ color: "#F1F5F9" }}>Empresa</span>
            <a href="#como-funciona" className="hover:opacity-70 transition-opacity" style={{ color: "#94A3B8" }}>Como funciona</a>
            <a href="#depoimentos" className="hover:opacity-70 transition-opacity" style={{ color: "#94A3B8" }}>Depoimentos</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 mt-10 pt-6 border-t" style={{ borderColor: "#334155" }}>
        <p className="text-center text-xs" style={{ color: "#64748B" }}>
          Acompanhamento Girassol &copy; {new Date().getFullYear()}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FamiliesSection />
        <TestimonialsSection />
        <KpisSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

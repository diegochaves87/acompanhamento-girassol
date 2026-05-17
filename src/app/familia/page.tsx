
function FeatureCard({
  icon,
  iconBg,
  title,
  desc,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
      style={{ borderRadius: 16 }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <h3
        className="font-bold text-base mb-1.5"
        style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
      >
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function FamiliaLanding() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF7E6" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/identidade-visual/Logo-Girassol.png" alt="" style={{ height: 36 }} />
            <span className="font-bold text-sm hidden sm:block" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
              Acompanhamento Girassol
            </span>
          </div>
          <a
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#1D3557", color: "#1D3557" }}
          >
            Já tenho conta
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-14 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: "#F0FFF4", color: "#4CAF50" }}
          >
            Gratuito para você, sempre
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
          >
            Acompanhe cada passo do desenvolvimento do seu familiar,{" "}
            <span style={{ color: "#8E6CCF" }}>de onde você estiver.</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            O Acompanhamento Girassol conecta você ao terapeuta do seu familiar de forma simples, bonita e gratuita para você.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1D3557" }}
            >
              Recebi um convite, quero me cadastrar
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Famílias mais conectadas com o cuidado do seu familiar
          </p>
        </div>

        <div className="relative flex justify-center">
          {/* Decorative blob */}
          <div
            className="absolute -top-6 -right-6 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ backgroundColor: "#8E6CCF" }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ backgroundColor: "#4CAF50" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/identidade-visual/hero-home2.png"
            alt="Família acompanhando o desenvolvimento"
            className="relative rounded-2xl shadow-2xl w-full max-w-md object-cover"
            style={{ borderRadius: 24 }}
          />
          {/* Floating card */}
          <div
            className="absolute bottom-6 left-0 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3"
            style={{ borderLeft: "4px solid #4CAF50" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F0FFF4" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="#4CAF50" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: "#1D3557" }}>Próxima sessão</p>
              <p className="text-xs text-gray-500">Amanhã às 14h00</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
        >
          Tudo que você precisa, num só lugar
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">Simples, acolhedor e pensado para você.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard
            iconBg="#F0FFF4"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 11-8 0 4 4 0 018 0zm6-4a4 4 0 11-8 0 4 4 0 018 0z" stroke="#4CAF50" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Cada sessão no seu celular"
            desc="Receba um resumo completo após cada atendimento do seu familiar."
          />
          <FeatureCard
            iconBg="#EFF6FF"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="#2E7BC1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Atividades para fazer em casa"
            desc="Orientações personalizadas para continuar o desenvolvimento no dia a dia."
          />
          <FeatureCard
            iconBg="#F3F0FF"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="#8E6CCF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Fale com o terapeuta"
            desc="Tire dúvidas e compartilhe observações a qualquer momento."
          />
          <FeatureCard
            iconBg="#FFFBEB"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="#FFC107" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Histórico sempre disponível"
            desc="Acompanhe a jornada desde o primeiro atendimento até hoje."
          />
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 relative">
          <svg
            className="absolute top-6 left-6 w-8 h-8 opacity-10"
            fill="#8E6CCF"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} className="w-4 h-4" fill="#FFC107" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-gray-700 leading-relaxed text-base italic mb-6">
            &quot;Antes eu ficava ansiosa não sabendo o que acontecia nas sessões. Agora recebo um resumo logo depois e consigo continuar o trabalho do terapeuta em casa. Fez toda a diferença na evolução do meu filho.&quot;
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0"
              style={{ backgroundColor: "#8E6CCF" }}
            >
              A
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#1D3557" }}>Ana Paula S.</p>
              <p className="text-xs text-gray-400">Mãe, São Paulo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-14 text-center px-6"
        style={{ backgroundColor: "#1D3557" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/identidade-visual/Logo-Girassol.png" alt="" style={{ height: 36 }} />
        </div>
        <h2
          className="text-3xl font-bold text-white mb-3"
          style={{ fontFamily: "var(--font-poppins, sans-serif)" }}
        >
          Recebi um convite do terapeuta
        </h2>
        <p className="text-white/70 text-base mb-8 max-w-md mx-auto">
          Acesse seu convite e crie sua conta gratuitamente para começar a acompanhar.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#4CAF50", color: "#fff" }}
        >
          Acessar minha conta
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      <footer className="py-6 text-center">
        <p className="text-xs text-gray-400">
          Acompanhamento Girassol &copy; {new Date().getFullYear()} &middot; Gratuito para familiares
        </p>
      </footer>
    </div>
  );
}

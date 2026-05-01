import Link from "next/link";

export default function SobrePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/terapeuta" className="text-white/60 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-semibold">Quem é Thaís Freitas</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* O que é */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13l-.87.5M4.21 17.5l-.87.5M20.66 17.5l-.87-.5M4.21 6.5l-.87-.5M21 12h-1M4 12H3" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "#1a4a3a" }}>
              O que é o Acompanhamento Girassol
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            O Acompanhamento Girassol é uma plataforma criada para fortalecer o vínculo entre terapeuta, paciente e família. Aqui, cada sessão, cada evolução e cada conquista são registradas com cuidado, formando um histórico vivo do percurso terapêutico.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            A proposta é simples: tornar o processo terapêutico mais transparente, humano e conectado, para que ninguém precise caminhar sozinho nessa jornada.
          </p>
        </div>

        {/* Como surgiu */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "#1a4a3a" }}>
              Como surgiu
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            A ideia nasceu da experiência de Thaís Freitas, terapeuta que percebeu, no dia a dia das famílias, uma necessidade real de mais conexão entre o espaço terapêutico e a vida em casa.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Em meio à correria da rotina, informações importantes sobre o tratamento ficavam perdidas, e as famílias muitas vezes se sentiam distantes do processo. O Girassol nasceu para mudar isso: aproximar quem cuida, quem acompanha e quem evolui a cada dia.
          </p>
        </div>

        {/* Conheça Thaís */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "#1a4a3a" }}>
              Conheça Thaís Freitas
            </h2>
          </div>
          <p className="text-sm text-gray-400 italic">
            Em breve você encontrará aqui a trajetória e a história de Thaís Freitas.
          </p>
        </div>

      </main>
    </div>
  );
}

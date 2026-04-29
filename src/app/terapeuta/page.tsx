import Link from "next/link";

const cards = [
  {
    title: "Pacientes",
    description: "Gerencie seus pacientes ativos",
    href: "/terapeuta/pacientes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m4-4a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      </svg>
    ),
  },
  {
    title: "Agenda",
    description: "Consulte e organize seus atendimentos",
    href: "/terapeuta/agenda",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
      </svg>
    ),
  },
  {
    title: "Financeiro",
    description: "Acompanhe pagamentos e receitas",
    href: "/terapeuta/financeiro",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
  {
    title: "Evoluções pendentes",
    description: "Registros de sessão aguardando preenchimento",
    href: "/terapeuta/evolucoes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
      </svg>
    ),
  },
  {
    title: "Clínicas",
    description: "Gerencie os locais onde você atende",
    href: "/terapeuta/clinicas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function TerapeutaDashboard() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7.5 3 12c0 2.8 1.3 5.3 3.3 7l1.2-2.4A7 7 0 0 1 5 12a7 7 0 0 1 7-7v10l5-5-5-5v3.5A4.5 4.5 0 0 0 7.5 12 4.5 4.5 0 0 0 12 16.5V21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">Jornada de Evolução Terapêutica</span>
          </div>
          <span className="text-white/60 text-xs">Terapeuta</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Boas-vindas */}
        <div className="mb-10">
          <p className="text-sm font-medium mb-1" style={{ color: "#4a7a6a" }}>Bem-vinda de volta,</p>
          <h1 className="text-3xl font-bold" style={{ color: "#1a4a3a" }}>Thaís Freitas</h1>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow group"
            >
              <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center group-hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
              >
                {card.icon}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 mb-1">{card.title}</h2>
                <p className="text-sm text-gray-500">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

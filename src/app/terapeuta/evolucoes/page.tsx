import Link from "next/link";

export default function EvolucoesPendentesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/terapeuta"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors mb-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-white font-semibold text-lg">Evoluções</h1>
          <p className="text-white/60 text-xs mt-0.5">Registro de evoluções das sessões</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-16">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#e8f0ec" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#1a4a3a" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 mb-1">Em breve</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            O módulo de evoluções está sendo desenvolvido. Em breve você poderá registrar e consultar as evoluções de cada sessão aqui.
          </p>
        </div>
      </main>
    </div>
  );
}

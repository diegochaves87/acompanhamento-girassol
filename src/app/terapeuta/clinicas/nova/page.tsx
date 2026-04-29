import Link from "next/link";
import NovaClinicaForm from "./NovaClinicaForm";

export default function NovaClinicaPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/terapeuta/clinicas"
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-semibold">Nova clínica</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <NovaClinicaForm />
      </main>
    </div>
  );
}

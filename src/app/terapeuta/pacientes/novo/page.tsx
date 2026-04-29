import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NovoPacienteForm from "./NovoPacienteForm";

async function getClinicas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinicas")
    .select("id, nome")
    .order("nome");
  return data ?? [];
}

export default async function NovoPacientePage() {
  const clinicas = await getClinicas();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/terapeuta/pacientes"
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-semibold">Novo paciente</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <NovoPacienteForm clinicas={clinicas} />
      </main>
    </div>
  );
}

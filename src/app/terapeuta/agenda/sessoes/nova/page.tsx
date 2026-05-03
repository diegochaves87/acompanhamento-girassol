import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function NovaSessaoSelecionarPaciente() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const { data: pacientes } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("tenant_id", userData?.tenant_id ?? "")
    .eq("active", true)
    .order("full_name");

  const lista = pacientes ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/terapeuta/agenda/sessoes"
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-white font-semibold leading-tight">Nova sessão</h1>
            <p className="text-white/60 text-xs">Selecione o paciente</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-14 flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-600 mb-1">Nenhum paciente ativo</p>
            <p className="text-sm text-gray-400 mb-5">
              Cadastre um paciente antes de criar uma sessão.
            </p>
            <Link
              href="/terapeuta/pacientes/novo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1a4a3a" }}
            >
              Cadastrar paciente
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-medium text-gray-500">
                Selecione o paciente para cadastrar a sessão
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {lista.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/terapeuta/pacientes/${p.id}/sessoes/nova`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
                    >
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-800">
                      {p.full_name}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

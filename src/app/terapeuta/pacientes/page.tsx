import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ImportarExcelButton, { BaixarModeloButton } from "./ImportarExcelButton";
import PacientesInativos from "./PacientesInativos";

type Paciente = {
  id: string;
  full_name: string;
  birth_date: string | null;
  diagnosis: string[] | null;
  active: boolean | null;
  inactivation_reason: string | null;
};

async function getPacientes(): Promise<{ ativos: Paciente[]; inativos: Paciente[] }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ativos: [], inativos: [] };

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData?.tenant_id) return { ativos: [], inativos: [] };

  const { data, error } = await supabase
    .from("patients")
    .select("id, full_name, birth_date, diagnosis, active, inactivation_reason")
    .eq("tenant_id", userData.tenant_id)
    .order("full_name");

  if (error) console.error("[getPacientes]", error.message);

  const todos = data ?? [];
  return {
    ativos: todos.filter((p) => p.active !== false),
    inativos: todos.filter((p) => p.active === false),
  };
}

type Props = { searchParams: { aviso?: string } };

export default async function PacientesPage({ searchParams }: Props) {
  const { ativos, inativos } = await getPacientes();
  const avisoSemEmail = searchParams.aviso === "responsavel-sem-email";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/terapeuta" className="text-white/60 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-white font-semibold">Pacientes</h1>
          </div>
          <div className="flex items-center gap-2">
            <BaixarModeloButton />
            <ImportarExcelButton />
            <Link
              href="/terapeuta/pacientes/novo"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#ffffff", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Novo paciente
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {avisoSemEmail && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Paciente salvo — responsável sem acesso ao app</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Nenhum e-mail foi informado para o responsável. O acesso ao app da família poderá ser configurado depois no perfil do paciente.
              </p>
            </div>
          </div>
        )}

        {ativos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-16 flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m4-4a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 mb-1">Nenhum paciente ativo</p>
            <p className="text-sm text-gray-400 mb-6">Adicione seu primeiro paciente ou importe uma planilha Excel.</p>
            <div className="flex items-center gap-3">
              <BaixarModeloButton variant="outline" />
              <ImportarExcelButton variant="outline" />
              <Link
                href="/terapeuta/pacientes/novo"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1a4a3a" }}
              >
                Cadastrar paciente
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {ativos.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/terapeuta/pacientes/${p.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
                    >
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.full_name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {p.diagnosis?.join(", ") ?? "Sem diagnóstico cadastrado"}
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <PacientesInativos inativos={inativos} />
      </main>
    </div>
  );
}

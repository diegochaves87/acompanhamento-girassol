import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ImportarExcelButton, { BaixarModeloButton } from "./ImportarExcelButton";
import PacientesControles from "./PacientesControles";

type Paciente = {
  id: string;
  full_name: string;
  birth_date: string | null;
  diagnosis: string[] | null;
  active: boolean | null;
  inactivation_reason: string | null;
  insurance_name: string | null;
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
    .select("id, full_name, birth_date, diagnosis, active, inactivation_reason, insurance_name")
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
  const showAviso = searchParams.aviso === "responsavel-sem-email";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/terapeuta"
              className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao menu principal
            </Link>
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
        <div className="max-w-4xl mx-auto mt-3">
          <h1 className="text-white font-semibold text-lg">Pacientes</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <PacientesControles ativos={ativos} inativos={inativos} showAviso={showAviso} />
      </main>
    </div>
  );
}

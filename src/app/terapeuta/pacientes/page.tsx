import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ImportarExcelButton, { BaixarModeloButton } from "./ImportarExcelButton";
import PacientesControles from "./PacientesControles";
import PageHeader from "@/components/PageHeader";

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
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <PageHeader
        title="Pacientes"
        backHref="/terapeuta"
        backLabel="Início"
        iconColor="#4CAF50"
        maxWidth="max-w-4xl"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.8} />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        actions={
          <div className="flex items-center gap-2">
            <BaixarModeloButton />
            <ImportarExcelButton />
            <Link
              href="/terapeuta/pacientes/novo"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1D3557" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
              </svg>
              Novo paciente
            </Link>
          </div>
        }
      />

      <main className="max-w-4xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
        <PacientesControles ativos={ativos} inativos={inativos} showAviso={showAviso} />
      </main>
    </div>
  );
}

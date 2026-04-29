import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditarClinicaForm from "./EditarClinicaForm";

type Props = { params: { id: string } };

async function getClinica(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[getClinica]", error.message);
  return data ?? null;
}

export default async function EditarClinicaPage({ params }: Props) {
  const clinica = await getClinica(params.id);
  if (!clinica) notFound();

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
          <h1 className="text-white font-semibold truncate">{clinica.name}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <EditarClinicaForm clinica={clinica} />
      </main>
    </div>
  );
}

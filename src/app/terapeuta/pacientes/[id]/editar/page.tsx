import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditarPacienteForm from "./EditarPacienteForm";

type Props = { params: { id: string } };

export default async function EditarPacientePage({ params }: Props) {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("id, full_name, cpf, birth_date, diagnosis, clinic_id, payment_type, value_per_session_brl, insurance_name, notes")
    .eq("id", params.id)
    .single();

  if (error || !patient) notFound();

  const { data: clinicas } = await supabase
    .from("clinics")
    .select("id, name, accepted_insurances")
    .order("name");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href={`/terapeuta/pacientes/${params.id}`}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-semibold">Editar paciente</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <EditarPacienteForm
          patient={patient}
          clinicas={(clinicas ?? []).map((c) => ({ id: c.id, name: c.name, accepted_insurances: c.accepted_insurances ?? [] }))}
        />
      </main>
    </div>
  );
}

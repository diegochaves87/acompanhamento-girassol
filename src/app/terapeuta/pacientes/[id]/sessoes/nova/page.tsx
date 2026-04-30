import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import NovaSessaoForm from "./NovaSessaoForm";

type Props = { params: { id: string } };

export default async function NovaSessaoPage({ params }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const [{ data: patient }, { data: clinicas }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name, value_per_session_brl")
      .eq("id", params.id)
      .single(),
    supabase
      .from("clinics")
      .select("id, name")
      .eq("tenant_id", userData?.tenant_id)
      .order("name"),
  ]);

  if (!patient) notFound();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href={`/terapeuta/pacientes/${params.id}/sessoes`}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-white font-semibold leading-tight">
              Nova sessão
            </h1>
            <p className="text-white/60 text-xs">{patient.full_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <NovaSessaoForm
          patientId={params.id}
          defaultValue={patient.value_per_session_brl ?? null}
          clinicas={clinicas ?? []}
        />
      </main>
    </div>
  );
}

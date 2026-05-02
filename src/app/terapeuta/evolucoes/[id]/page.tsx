import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = { params: { id: string } };

function formatDate(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  const weekdays = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira",
    "quinta-feira", "sexta-feira", "sábado",
  ];
  const weekday = weekdays[d.getUTCDay()];
  const date = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${weekday}, ${date} às ${time}`;
}

export default async function VerEvolucaoPage({ params }: Props) {
  const supabase = await createClient();

  const { data: evo } = await supabase
    .from("evolutions")
    .select("id, session_id, patient_id, technical_text, family_text, status, updated_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!evo) notFound();

  const [patientRes, sessionRes] = await Promise.all([
    supabase.from("patients").select("full_name").eq("id", evo.patient_id).maybeSingle(),
    supabase.from("sessions").select("scheduled_at, clinics(name)").eq("id", evo.session_id).maybeSingle(),
  ]);

  const patientName = patientRes.data?.full_name ?? "Paciente";
  const session = sessionRes.data;
  const clinicName = (session?.clinics as { name?: string } | null)?.name ?? null;

  const updatedAt = evo.updated_at
    ? new Date(evo.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/terapeuta/evolucoes?aba=publicadas"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors mb-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Evoluções
          </Link>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-white font-semibold text-lg">Evolução publicada</h1>
              {updatedAt && (
                <p className="text-white/60 text-xs mt-0.5">Atualizada em {updatedAt}</p>
              )}
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
              PUBLICADA
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        {/* Cabeçalho da sessão */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#e8f0ec" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#1a4a3a" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{patientName}</p>
            {session?.scheduled_at && (
              <p className="text-sm text-gray-400 mt-0.5">
                {[formatDate(session.scheduled_at), clinicName].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Texto técnico */}
        {evo.technical_text && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Texto técnico</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{evo.technical_text}</p>
          </div>
        )}

        {/* Texto para a família */}
        {evo.family_text && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700">Versão para a família</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">PUBLICADA</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{evo.family_text}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3">
          <Link
            href={`/terapeuta/evolucoes/nova?sessao=${evo.session_id}`}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Editar
          </Link>
        </div>
      </main>
    </div>
  );
}

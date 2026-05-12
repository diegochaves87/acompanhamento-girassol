import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamiliaDashboard, { type FamilySession, type FeedItem } from "./FamiliaDashboard";

function PendingScreen({ nome }: { nome: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#FFF7E6" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/identidade-visual/Logo-Nome-Slogan.png" alt="Acompanhamento Girassol" style={{ height: 60, marginBottom: 28 }} />
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div
          className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#FFF7E6" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/identidade-visual/Logo-Girassol.png" alt="" style={{ height: 52 }} className="animate-pulse" />
        </div>
        <h2
          className="text-xl font-bold mb-3"
          style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
        >
          Olá, {nome.split(" ")[0]}!
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Seu cadastro está em análise. O terapeuta responsável irá liberar seu acesso em breve.
        </p>
        <p className="text-xs text-gray-400">
          Assim que seu acesso for aprovado, você receberá uma notificação por e-mail.
        </p>
        <div className="mt-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: "#4CAF50", animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function FamiliaDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/familia/login");

  // Registro ativo
  const { data: access } = await supabase
    .from("family_access")
    .select("id, nome, patient_id, relacao, descricao_paciente, status")
    .eq("email", user.email!)
    .maybeSingle();

  if (!access) redirect("/familia");

  if (access.status !== "ativo") {
    return <PendingScreen nome={access.nome} />;
  }

  // Dados em paralelo
  const [patientRes, sessionsRes] = await Promise.all([
    supabase
      .from("patients")
      .select("full_name, foto_url, sexo, tenant_id")
      .eq("id", access.patient_id)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("id, scheduled_at, duration_minutes, status, clinics(name, phone)")
      .eq("patient_id", access.patient_id)
      .gte("scheduled_at", new Date().toISOString())
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(10),
  ]);

  const patient = patientRes.data;

  // Terapeuta via tenant_id do paciente
  let therapistNome = "Terapeuta";
  let therapistEspec: string | null = null;
  if (patient?.tenant_id) {
    const { data: tUser } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("tenant_id", patient.tenant_id)
      .maybeSingle();
    if (tUser) {
      therapistNome = tUser.full_name ?? "Terapeuta";
      const { data: prof } = await supabase
        .from("profiles")
        .select("especialidades")
        .eq("id", tUser.id)
        .maybeSingle();
      const espec = prof?.especialidades as Array<{ name: string }> | null;
      therapistEspec = espec?.[0]?.name ?? null;
    }
  }

  // Feed: notas publicadas + posts da família (graceful fallback)
  let notes: FeedItem[] = [];
  let posts: FeedItem[] = [];

  try {
    const { data: notesData } = await supabase
      .from("multidisciplinary_notes")
      .select("id, created_at, content, context_type")
      .eq("patient_id", access.patient_id)
      .eq("published_to_family", true)
      .order("created_at", { ascending: false })
      .limit(20);
    notes = (notesData ?? []).map((n) => ({
      id: n.id,
      created_at: n.created_at,
      content: n.content ?? "",
      context_type: n.context_type ?? "evolucao",
      source: "terapeuta" as const,
      image_url: null,
    }));
  } catch {}

  try {
    const { data: postsData } = await supabase
      .from("family_posts")
      .select("id, created_at, content, image_url")
      .eq("patient_id", access.patient_id)
      .order("created_at", { ascending: false })
      .limit(20);
    posts = (postsData ?? []).map((p) => ({
      id: p.id,
      created_at: p.created_at,
      content: p.content,
      context_type: "familia",
      source: "familia" as const,
      image_url: p.image_url ?? null,
    }));
  } catch {}

  const feedItems: FeedItem[] = [...notes, ...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let notifCount = 0;
  try {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("lida", false);
    notifCount = count ?? 0;
  } catch {}

  return (
    <FamiliaDashboard
      familiarNome={access.nome}
      familiarId={access.id}
      patientId={access.patient_id}
      patientNome={patient?.full_name ?? "Familiar"}
      patientFoto={patient?.foto_url ?? null}
      descricaoPaciente={access.descricao_paciente ?? null}
      therapistNome={therapistNome}
      therapistEspec={therapistEspec}
      sessions={(sessionsRes.data ?? []) as unknown as FamilySession[]}
      feedItems={feedItems}
      notifCount={notifCount}
    />
  );
}

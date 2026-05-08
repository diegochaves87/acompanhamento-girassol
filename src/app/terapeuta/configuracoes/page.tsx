import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PerfilForm from "./PerfilForm";
import PageHeader from "@/components/PageHeader";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [usersRes, profilesRes] = await Promise.all([
    supabase.from("users").select("full_name, profession, specialty").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  const userData = usersRes.data;
  const profileData = profilesRes.data ?? {};

  const initial = userData?.full_name?.trim()[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <PageHeader
        title="Meu Perfil"
        subtitle="Dados pessoais, acadêmicos e profissionais"
        backHref="/terapeuta"
        backLabel="Início"
        iconColor="#4CAF50"
        maxWidth="max-w-2xl"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={1.8} />
          </svg>
        }
      />

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {/* Avatar card */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: "#4CAF50", color: "white" }}
          >
            {initial}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-lg">{userData?.full_name ?? "—"}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {userData?.specialty && (
              <p className="text-xs font-medium mt-0.5" style={{ color: "#4CAF50" }}>{userData.specialty}</p>
            )}
          </div>
        </section>

        {/* Form */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <PerfilForm
            userId={user.id}
            email={user.email ?? ""}
            initialName={userData?.full_name ?? ""}
            initialProfession={userData?.profession ?? ""}
            initialSpecialty={userData?.specialty ?? ""}
            profileData={profileData}
          />
        </section>
      </main>
    </div>
  );
}

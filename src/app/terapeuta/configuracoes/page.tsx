import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import PerfilForm from "./PerfilForm";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("full_name, profession, specialty")
    .eq("id", user.id)
    .maybeSingle();

  const initial = userData?.full_name?.trim()[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/terapeuta"
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-white font-semibold leading-tight">Meu Perfil</h1>
            <p className="text-white/60 text-xs">Configurações da conta</p>
          </div>
        </div>
      </header>

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
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Informações pessoais</h2>
          <PerfilForm
            userId={user.id}
            initialName={userData?.full_name ?? ""}
            initialProfession={userData?.profession ?? ""}
            initialSpecialty={userData?.specialty ?? ""}
            email={user.email ?? ""}
          />
        </section>
      </main>
    </div>
  );
}

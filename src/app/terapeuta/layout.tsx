import TerapeutaNav from "./TerapeutaNav";
import { createClient } from "@/lib/supabase/server";

export default async function TerapeutaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profissional: { full_name: string | null; profession: string | null; specialty: string | null } | null = null;

  if (user) {
    const { data, error } = await supabase
      .from("users")
      .select("full_name, profession, specialty")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[TerapeutaLayout] erro ao buscar perfil:", error.message);
      // Fallback: busca só full_name caso as colunas ainda não existam
      const { data: fallback } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      profissional = fallback
        ? { full_name: fallback.full_name, profession: null, specialty: null }
        : null;
    } else {
      console.log("[TerapeutaLayout] perfil:", JSON.stringify(data));
      profissional = data ?? null;
    }
  }

  return (
    <>
      {children}
      <TerapeutaNav />
      <div className="fixed top-3 right-4 z-30 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100 text-right max-w-[220px]">
        <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
          {profissional?.full_name ?? "—"}
        </p>
        <p className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
          {[profissional?.profession, profissional?.specialty].filter(Boolean).join(", ") || "Sem dados de formação"}
        </p>
      </div>
    </>
  );
}

import TerapeutaNav from "./TerapeutaNav";
import { createClient } from "@/lib/supabase/server";

export default async function TerapeutaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profissional: { full_name: string | null; profession: string | null; specialty: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("full_name, profession, specialty")
      .eq("id", user.id)
      .maybeSingle();
    profissional = data ?? null;
  }

  return (
    <>
      {children}
      <TerapeutaNav />
      {profissional?.full_name && (
        <div className="fixed top-3 right-4 z-30 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100 text-right max-w-[220px]">
          <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
            {profissional.full_name}
          </p>
          {(profissional.profession || profissional.specialty) && (
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
              {[profissional.profession, profissional.specialty].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      )}
    </>
  );
}

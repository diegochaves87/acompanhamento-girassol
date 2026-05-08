import TerapeutaShell from "./TerapeutaShell";
import { createClient } from "@/lib/supabase/server";

export default async function TerapeutaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profissional: {
    full_name: string | null;
    profession: string | null;
    specialty: string | null;
    email: string | null;
    userId: string | null;
    foto_url: string | null;
  } | null = null;

  if (user) {
    const [usersRes, profilesRes] = await Promise.all([
      supabase.from("users").select("full_name, profession, specialty").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("foto_url").eq("id", user.id).maybeSingle(),
    ]);
    const { data, error } = usersRes;

    if (error) {
      console.error("[TerapeutaLayout] erro ao buscar perfil:", error.message);
      const { data: fallback } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      profissional = fallback
        ? { full_name: fallback.full_name, profession: null, specialty: null, email: user.email ?? null, userId: user.id, foto_url: profilesRes.data?.foto_url ?? null }
        : null;
    } else {
      profissional = data
        ? { ...data, email: user.email ?? null, userId: user.id, foto_url: profilesRes.data?.foto_url ?? null }
        : null;
    }
  }

  return (
    <TerapeutaShell profissional={profissional}>
      {children}
    </TerapeutaShell>
  );
}

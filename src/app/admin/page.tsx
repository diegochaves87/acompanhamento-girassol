import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import ImpersonateButton from "./ImpersonateButton";
import ApproveRejectButtons from "./ApproveRejectButtons";

const ADMIN_EMAIL = "dcchaves25@gmail.com";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/terapeuta");
  }

  const admin = createAdminClient();

  const [usersRes, pendingRes] = await Promise.all([
    admin.from("users").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
    admin.from("pending_users").select("*").eq("status", "pendente").order("created_at", { ascending: false }),
  ]);

  const users = usersRes.data ?? [];
  const pending = pendingRes.data ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="max-w-4xl mx-auto px-5 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Painel Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">Logado como {user.email}</p>
        </div>

        {/* Aprovações pendentes */}
        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-4" style={{ color: "#FF5C7A" }}>
              Cadastros aguardando aprovação ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{p.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.email}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {p.profissao && <span className="text-xs text-gray-400">{p.profissao}</span>}
                      {p.plano && <span className="text-xs text-gray-400">Plano: {p.plano}</span>}
                      {p.telefone && <span className="text-xs text-gray-400">{p.telefone}</span>}
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <ApproveRejectButtons pendingId={p.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lista de usuários */}
        <section>
          <h2 className="text-base font-semibold mb-4" style={{ color: "#1D3557" }}>
            Usuários cadastrados ({users.length})
          </h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: "#4CAF50" }}
                >
                  {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{u.full_name ?? "—"}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Cadastrado em {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {u.id !== user.id && (
                  <ImpersonateButton userId={u.id} userName={u.full_name ?? u.email ?? "Usuário"} />
                )}
                {u.id === user.id && (
                  <span className="text-xs text-gray-400 px-3 py-1.5">Você</span>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">Nenhum usuário encontrado.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

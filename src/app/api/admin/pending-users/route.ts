import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

const ADMIN_EMAIL = "dcchaves25@gmail.com";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { pendingId, action } = await req.json() as { pendingId: string; action: "approve" | "reject" };

  if (!pendingId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "reject") {
    const { error } = await admin
      .from("pending_users")
      .update({ status: "rejeitado" })
      .eq("id", pendingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Approve: fetch the pending user, create auth user, mark as approved
  const { data: pending, error: fetchErr } = await admin
    .from("pending_users")
    .select("*")
    .eq("id", pendingId)
    .single();

  if (fetchErr || !pending) {
    return NextResponse.json({ error: "Cadastro não encontrado." }, { status: 404 });
  }

  const tempPassword = Math.random().toString(36).slice(2, 10) + "Aa1!";
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: pending.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: pending.nome },
  });

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  const newUserId = created.user.id;

  // Insert into users table
  await admin.from("users").insert({
    id: newUserId,
    full_name: pending.nome,
    email: pending.email,
  });

  // Mark as approved
  await admin
    .from("pending_users")
    .update({ status: "aprovado" })
    .eq("id", pendingId);

  return NextResponse.json({ ok: true, userId: newUserId });
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  accessId: string;
  nome: string;
}

export default function AprovarFamiliarButton({ accessId, nome }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleAprovar() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("family_access")
      .update({ status: "ativo", approved_at: new Date().toISOString(), approved_by: user?.id })
      .eq("id", accessId);
    setLoading(false);
    setDone(true);
    window.location.reload();
  }

  if (done) return (
    <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F0FFF4", color: "#166534" }}>
      Aprovado
    </span>
  );

  return (
    <button
      onClick={handleAprovar}
      disabled={loading}
      className="text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: "#4CAF50" }}
    >
      {loading ? "Aprovando..." : `Aprovar acesso de ${nome}`}
    </button>
  );
}

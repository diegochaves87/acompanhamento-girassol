"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DespublicarButton({ evolucaoId }: { evolucaoId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("evolutions").update({ status: "draft" }).eq("id", evolucaoId);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "…" : "Despublicar"}
    </button>
  );
}

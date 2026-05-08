"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveRejectButtons({ pendingId }: { pendingId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    const res = await fetch("/api/admin/pending-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingId, action }),
    });
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      const { error } = await res.json();
      alert(error ?? "Erro ao processar.");
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "#4CAF50", color: "#ffffff" }}
      >
        {loading === "approve" ? "..." : "Aprovar"}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "#FF5C7A", color: "#ffffff" }}
      >
        {loading === "reject" ? "..." : "Rejeitar"}
      </button>
    </div>
  );
}

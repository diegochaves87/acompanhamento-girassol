"use client";

import { useState } from "react";

type Props = {
  patientId: string;
  guardianEmail: string;
  guardianName: string | null;
  invitedAt: string | null;
};

export default function LiberarAcessoButton({ patientId, guardianEmail, guardianName, invitedAt }: Props) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(!!invitedAt);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/invite-guardian", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guardian_email: guardianEmail,
        guardian_name: guardianName,
        patient_id: patientId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao enviar convite.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Convite enviado
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
        style={{ backgroundColor: "#1a4a3a" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
        </svg>
        {loading ? "Enviando…" : "Liberar acesso ao app"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2 font-mono">{error}</p>}
    </div>
  );
}

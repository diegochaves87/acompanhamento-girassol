"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const RELACOES = ["Mãe", "Pai", "Avó", "Avô", "Responsável", "Outro"];

interface Props {
  patientId: string;
  patientName: string;
  guardianName?: string | null;
  guardianEmail?: string | null;
  guardianPhone?: string | null;
}

export default function ConvidarFamiliarModal({
  patientId,
  patientName,
  guardianName,
  guardianEmail,
  guardianPhone,
}: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(guardianName ?? "");
  const [email, setEmail] = useState(guardianEmail ?? "");
  const [relacao, setRelacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ token: string; link: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [terapeutaNome, setTerapeutaNome] = useState<string | null>(null);

  function reset() {
    setNome(guardianName ?? "");
    setEmail(guardianEmail ?? "");
    setRelacao("");
    setError("");
    setResult(null);
    setCopied(false);
  }

  async function handleOpen() {
    reset();
    setOpen(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle();
      setTerapeutaNome(data?.full_name ?? null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) { setError("Preencha nome e e-mail."); return; }
    setLoading(true); setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("family_access")
      .insert({
        patient_id: patientId,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        relacao: relacao || null,
      })
      .select("invite_token")
      .single();
    setLoading(false);
    if (err || !data) {
      setError(
        err?.code === "42501"
          ? "Sem permissão para criar convite. Verifique as políticas de acesso."
          : "Erro ao criar convite. Tente novamente."
      );
      return;
    }
    const link = `${window.location.origin}/convite/${data.invite_token}`;
    setResult({ token: data.invite_token, link });
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const waMsg = result
    ? encodeURIComponent(
        `Olá, ${nome}! Sou ${terapeutaNome ?? "sua terapeuta"} e quero te convidar para acompanhar a evolução de ${patientName} pelo Acompanhamento Girassol. É gratuito e vai te manter sempre por dentro de cada sessão. Acesse: ${result.link}`
      )
    : "";

  const waHref = result
    ? guardianPhone
      ? `https://wa.me/55${guardianPhone.replace(/\D/g, "")}?text=${waMsg}`
      : `https://wa.me/?text=${waMsg}`
    : "#";

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white";

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#4CAF50" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor" />
          <path d="M19 7h-2V5h-2v2h-2v2h2v2h2V9h2V7z" fill="currentColor" />
        </svg>
        Convidar familiar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); reset(); } }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
                Convidar familiar
              </h3>
              <button onClick={() => { setOpen(false); reset(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {result ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: "#F0FFF4" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#4CAF50" }}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#1D3557" }}>Convite criado!</p>
                    <p className="text-xs text-gray-500">Envie o link ou WhatsApp para {nome}.</p>
                  </div>
                </div>

                <div className="rounded-xl border p-3 text-xs break-all" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                  {result.link}
                </div>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  {guardianPhone ? `Enviar WhatsApp para ${nome.split(" ")[0]}` : "Compartilhar por WhatsApp"}
                </a>

                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={{ borderColor: copied ? "#4CAF50" : "#E5E7EB", color: copied ? "#4CAF50" : "#374151" }}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#4CAF50" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Link copiado!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Copiar link
                    </>
                  )}
                </button>

                <button
                  onClick={() => { setOpen(false); reset(); window.location.reload(); }}
                  className="text-xs text-center transition-opacity hover:opacity-60"
                  style={{ color: "#9CA3AF" }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Nome do familiar</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="familiar@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
                {guardianPhone && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "#F0FFF4", color: "#166534" }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    WhatsApp será enviado para {guardianPhone}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Relação com o paciente</label>
                  <select value={relacao} onChange={(e) => setRelacao(e.target.value)} className={inputCls}>
                    <option value="">Selecionar...</option>
                    {RELACOES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); reset(); }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: "#4CAF50" }}
                  >
                    {loading ? "Gerando..." : "Gerar convite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

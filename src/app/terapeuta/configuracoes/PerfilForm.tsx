"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  initialName: string;
  initialProfession: string;
  initialSpecialty: string;
  email: string;
};

export default function PerfilForm({
  userId,
  initialName,
  initialProfession,
  initialSpecialty,
  email,
}: Props) {
  const [nome, setNome] = useState(initialName);
  const [profissao, setProfissao] = useState(initialProfession);
  const [especialidade, setEspecialidade] = useState(initialSpecialty);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSave() {
    setSaving(true);
    setErro("");
    setSuccess(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ full_name: nome.trim(), profession: profissao.trim(), specialty: especialidade.trim() })
      .eq("id", userId);
    if (error) {
      setErro(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      {/* Email — read only */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">E-mail</label>
        <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 select-none">
          {email}
        </div>
      </div>

      {/* Nome */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nome completo</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white transition-colors"
          placeholder="Seu nome completo"
        />
      </div>

      {/* Profissão */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Profissão</label>
        <input
          type="text"
          value={profissao}
          onChange={(e) => setProfissao(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white transition-colors"
          placeholder="Ex: Terapeuta Ocupacional"
        />
      </div>

      {/* Especialidade */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Especialidade(s)</label>
        <input
          type="text"
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white transition-colors"
          placeholder="Ex: Autismo, TDAH"
        />
      </div>

      {/* Foto de perfil — placeholder */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Foto de perfil</label>
        <div className="px-4 py-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
          <p className="text-sm text-gray-400">Upload de foto em breve.</p>
        </div>
      </div>

      {/* Feedback */}
      {erro && <p className="text-sm text-red-600 font-medium">{erro}</p>}
      {success && (
        <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#4CAF50" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Alterações salvas!
        </p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
        style={{ backgroundColor: "#4CAF50" }}
      >
        {saving ? "Salvando…" : "Salvar alterações"}
      </button>
    </div>
  );
}

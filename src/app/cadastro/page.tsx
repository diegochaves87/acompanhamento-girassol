"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const PLANOS = ["Básico", "Profissional", "Premium"];
const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const SEXO_OPTIONS = [
  { value: "nao_informado", label: "Prefiro não informar" },
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
];

function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

type DynamicItem = { value: string };

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
const sectionCls = "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4";

function SectionHeader({ title, onAdd, addLabel }: { title: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-1">
      <h3 className="text-sm font-semibold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
        {title}
      </h3>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#4CAF50", color: "#fff" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {addLabel ?? "Adicionar"}
        </button>
      )}
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  );
}

function CadastroForm() {
  const searchParams = useSearchParams();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [telefone, setTelefone] = useState("");
  const [sexo, setSexo] = useState("nao_informado");

  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  const [formacoes, setFormacoes] = useState<DynamicItem[]>([]);
  const [especialidades, setEspecialidades] = useState<DynamicItem[]>([]);
  const [plano, setPlano] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function lookupCep(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setLogradouro(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setUf(data.uf ?? "");
      }
    } catch {}
    setCepLoading(false);
  }

  function addFormacao() { setFormacoes((p) => [...p, { value: "" }]); }
  function removeFormacao(i: number) { setFormacoes((p) => p.filter((_, idx) => idx !== i)); }
  function updateFormacao(i: number, value: string) { setFormacoes((p) => p.map((x, idx) => idx === i ? { value } : x)); }

  function addEspecialidade() { setEspecialidades((p) => [...p, { value: "" }]); }
  function removeEspecialidade(i: number) { setEspecialidades((p) => p.filter((_, idx) => idx !== i)); }
  function updateEspecialidade(i: number, value: string) { setEspecialidades((p) => p.map((x, idx) => idx === i ? { value } : x)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endereco = [
      cep && `CEP: ${cep}`,
      logradouro,
      numero && `nº ${numero}`,
      complemento,
      bairro,
      cidade && uf ? `${cidade}/${uf}` : cidade || uf,
    ].filter(Boolean).join(", ");

    const supabase = createClient();
    const { error: dbError } = await supabase.from("pending_users").insert({
      nome,
      cpf: cpf.replace(/\D/g, "") || null,
      email,
      telefone: telefone || null,
      sexo: sexo || null,
      endereco: endereco || null,
      plano: plano || null,
      formacoes: formacoes.filter((f) => f.value.trim()).map((f) => ({ name: f.value.trim() })),
      especialidades: especialidades.filter((e) => e.value.trim()).map((e) => ({ name: e.value.trim() })),
    });

    setLoading(false);
    if (dbError) {
      setError("Erro ao enviar cadastro. Verifique os dados e tente novamente.");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F0FFF4" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4CAF50" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Cadastro enviado!
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Recebemos sua solicitação. Nossa equipe analisará e você receberá um e-mail quando seu acesso for liberado.
          </p>
          <Link href="/login" className="inline-block mt-6 text-sm font-bold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#4CAF50", color: "#ffffff" }}>
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-completa.png" alt="Girassol" style={{ height: 64, margin: "0 auto 12px" }} />
          <h1 className="text-2xl font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Solicitar acesso
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Preencha seus dados. Nossa equipe aprovará seu cadastro em breve.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Dados pessoais */}
          <div className={sectionCls}>
            <SectionHeader title="Dados pessoais" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Nome completo *</label>
                <input type="text" required placeholder="Seu nome completo" value={nome}
                  onChange={(e) => setNome(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CPF</label>
                <input type="text" inputMode="numeric" placeholder="000.000.000-00" value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sexo</label>
                <select value={sexo} onChange={(e) => setSexo(e.target.value)} className={`${inputCls} bg-white`}>
                  {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>E-mail *</label>
                <input type="email" required placeholder="seu@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Telefone</label>
                <input type="tel" placeholder="(00) 00000-0000" value={telefone}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className={sectionCls}>
            <SectionHeader title="Endereço" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>{cepLoading ? "CEP — buscando…" : "CEP"}</label>
                <input type="text" inputMode="numeric" placeholder="00000-000" value={cep}
                  onChange={(e) => {
                    const masked = maskCep(e.target.value);
                    setCep(masked);
                    lookupCep(masked);
                  }} className={inputCls} />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className={labelCls}>Logradouro</label>
                <input type="text" placeholder="Rua, Avenida…" value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Número</label>
                <input type="text" placeholder="123" value={numero}
                  onChange={(e) => setNumero(e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className={labelCls}>Complemento</label>
                <input type="text" placeholder="Apto, Sala…" value={complemento}
                  onChange={(e) => setComplemento(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Bairro</label>
                <input type="text" placeholder="Bairro" value={bairro}
                  onChange={(e) => setBairro(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input type="text" placeholder="Cidade" value={cidade}
                  onChange={(e) => setCidade(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>UF</label>
                <select value={uf} onChange={(e) => setUf(e.target.value)} className={`${inputCls} bg-white`}>
                  <option value="">UF</option>
                  {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Formações */}
          <div className={sectionCls}>
            <SectionHeader title="Formação acadêmica" onAdd={addFormacao} addLabel="+ Adicionar formação" />
            {formacoes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                Clique em &ldquo;+ Adicionar formação&rdquo; para incluir sua formação.
              </p>
            )}
            <div className="space-y-2.5">
              {formacoes.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Bacharelado em Terapia Ocupacional — USP (2018)"
                    value={f.value}
                    onChange={(e) => updateFormacao(i, e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white"
                  />
                  <button type="button" onClick={() => removeFormacao(i)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" style={{ color: "#EF4444" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Especialidades */}
          <div className={sectionCls}>
            <SectionHeader title="Especialidades" onAdd={addEspecialidade} addLabel="+ Adicionar especialidade" />
            {especialidades.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                Clique em &ldquo;+ Adicionar especialidade&rdquo; para incluir suas especialidades.
              </p>
            )}
            <div className="space-y-2.5">
              {especialidades.map((esp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Autismo, TDAH, Integração Sensorial…"
                    value={esp.value}
                    onChange={(e) => updateEspecialidade(i, e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white"
                  />
                  <button type="button" onClick={() => removeEspecialidade(i)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" style={{ color: "#EF4444" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Plano */}
          <div className={sectionCls}>
            <SectionHeader title="Plano de interesse" />
            <div>
              <label className={labelCls}>Escolha seu plano <span className="text-gray-400 font-normal">(opcional)</span></label>
              <select value={plano} onChange={(e) => setPlano(e.target.value)} className={`${inputCls} bg-white`}>
                <option value="">Sem preferência</option>
                {PLANOS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ backgroundColor: "#4CAF50" }}
          >
            {loading ? "Enviando…" : "Solicitar acesso"}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            Já tem acesso?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#4CAF50" }}>
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

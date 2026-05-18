"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

type DocItem = { name: string; file?: File; file_url?: string };

type ProfileData = {
  cpf?: string;
  phone?: string;
  sexo?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  formacoes?: Array<{ name: string; file_url?: string }>;
  especialidades?: Array<{ name: string; file_url?: string }>;
  courses?: Array<{ name: string; file_url?: string }>;
  conselho_nome?: string;
  conselho_numero?: string;
  profissao?: string;
  // legacy fields kept for backward-compat initialization only
  education?: string;
  specialties?: string;
};

type Props = {
  userId: string;
  email: string;
  initialName: string;
  initialProfession: string;
  initialSpecialty: string;
  profileData: ProfileData;
};

function maskCpf(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCep(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">
      {children}
    </h3>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white transition-colors";
const readOnlyCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 bg-gray-50 select-none";

function initDocItems(
  newData: Array<{ name: string; file_url?: string }> | undefined,
  legacyText?: string,
  defaultEmpty = false
): DocItem[] {
  if (newData && newData.length > 0) return newData.map((x) => ({ name: x.name, file_url: x.file_url }));
  if (legacyText) return [{ name: legacyText }];
  if (defaultEmpty) return [{ name: "" }];
  return [];
}

function addItem(setter: React.Dispatch<React.SetStateAction<DocItem[]>>) {
  setter((prev) => [...prev, { name: "" }]);
}
function removeItem(setter: React.Dispatch<React.SetStateAction<DocItem[]>>, i: number) {
  setter((prev) => prev.filter((_, idx) => idx !== i));
}
function updateName(setter: React.Dispatch<React.SetStateAction<DocItem[]>>, i: number, name: string) {
  setter((prev) => prev.map((x, idx) => (idx === i ? { ...x, name } : x)));
}
function updateFile(setter: React.Dispatch<React.SetStateAction<DocItem[]>>, i: number, file: File) {
  setter((prev) => prev.map((x, idx) => (idx === i ? { ...x, file } : x)));
}

function DynamicList({
  items,
  setter,
  addLabel,
  placeholder,
  attachLabel,
}: {
  items: DocItem[];
  setter: React.Dispatch<React.SetStateAction<DocItem[]>>;
  addLabel: string;
  placeholder: string;
  attachLabel: string;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">
          Clique em &ldquo;{addLabel}&rdquo; para adicionar.
        </p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1.5 p-3 rounded-xl border border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white"
              value={item.name}
              onChange={(e) => updateName(setter, i, e.target.value)}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeItem(setter, i)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
              style={{ color: "#EF4444" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <DocFileRow
            label={attachLabel}
            existingUrl={item.file_url}
            currentFile={item.file}
            onFile={(f) => updateFile(setter, i, f)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => addItem(setter)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors w-full justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {addLabel}
      </button>
    </div>
  );
}

export default function PerfilForm({
  userId,
  email,
  initialName,
  initialProfession,
  initialSpecialty,
  profileData,
}: Props) {
  const [nome, setNome] = useState(initialName);
  const [profissao, setProfissao] = useState(profileData.profissao ?? initialProfession);
  const [conselhoNome, setConselhoNome] = useState(profileData.conselho_nome ?? "");
  const [conselhoNumero, setConselhoNumero] = useState(profileData.conselho_numero ?? "");

  const [cpf, setCpf] = useState(maskCpf(profileData.cpf ?? ""));
  const [phone, setPhone] = useState(maskPhone(profileData.phone ?? ""));
  const [sexo, setSexo] = useState(profileData.sexo ?? "nao_informado");

  const [zip, setZip] = useState(maskCep(profileData.address_zip ?? ""));
  const [street, setStreet] = useState(profileData.address_street ?? "");
  const [number, setNumber] = useState(profileData.address_number ?? "");
  const [complement, setComplement] = useState(profileData.address_complement ?? "");
  const [neighborhood, setNeighborhood] = useState(profileData.address_neighborhood ?? "");
  const [city, setCity] = useState(profileData.address_city ?? "");
  const [uf, setUf] = useState(profileData.address_state ?? "");
  const [cepLoading, setCepLoading] = useState(false);

  const [formacoes, setFormacoes] = useState<DocItem[]>(
    initDocItems(profileData.formacoes, profileData.education, true)
  );
  const [especialidades, setEspecialidades] = useState<DocItem[]>(
    initDocItems(profileData.especialidades, profileData.specialties ?? initialSpecialty, true)
  );
  const [courses, setCourses] = useState<DocItem[]>(
    (profileData.courses ?? []).map((c) => ({ name: c.name, file_url: c.file_url }))
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState("");

  async function lookupCep(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro ?? "");
        setNeighborhood(data.bairro ?? "");
        setCity(data.localidade ?? "");
        setUf(data.uf ?? "");
      }
    } catch {}
    setCepLoading(false);
  }

  async function uploadFile(file: File, field: string): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${userId}/${field}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("documentos")
      .upload(path, file, { upsert: true });
    if (error) { console.warn("Upload falhou:", error.message); return null; }
    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  async function uploadDocItems(items: DocItem[], prefix: string) {
    return Promise.all(
      items.map(async (item, i) => {
        let url = item.file_url;
        if (item.file) {
          const uploaded = await uploadFile(item.file, `${prefix}-${i}`);
          if (uploaded) url = uploaded;
        }
        return { name: item.name, file_url: url };
      })
    );
  }

  async function handleSave() {
    setErro("");
    setSuccess(false);
    if (!conselhoNome.trim() || !conselhoNumero.trim() || formacoes.filter(f => f.name).length === 0) {
      setErro("Preencha os campos obrigatórios: Formação, Nome do Conselho e Número do Conselho.");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const [formacoesResult, especialidadesResult, coursesResult] = await Promise.all([
      uploadDocItems(formacoes, "formacao"),
      uploadDocItems(especialidades, "especialidade"),
      uploadDocItems(courses, "curso"),
    ]);

    await supabase.from("users").update({
      full_name: nome.trim(),
      profession: profissao.trim(),
      specialty: especialidades[0]?.name ?? initialSpecialty,
    }).eq("id", userId);

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: nome.trim(),
        cpf: cpf.replace(/\D/g, ""),
        phone: phone.replace(/\D/g, ""),
        sexo,
        address_street: street,
        address_number: number,
        address_complement: complement,
        address_neighborhood: neighborhood,
        address_city: city,
        address_state: uf,
        address_zip: zip.replace(/\D/g, ""),
        formacoes: formacoesResult,
        especialidades: especialidadesResult,
        courses: coursesResult,
        conselho_nome: conselhoNome,
        conselho_numero: conselhoNumero,
        profissao: profissao.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) setErro(error.message);
    else setSuccess(true);
    setSaving(false);
  }

  return (
    <div className="space-y-8">

      {/* Dados da Conta */}
      <div>
        <SectionTitle>Dados da Conta</SectionTitle>
        <div className="space-y-4">
          <Field label="E-mail">
            <div className={readOnlyCls}>{email}</div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome completo">
              <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
            </Field>
            <Field label="Profissão">
              <input className={inputCls} value={profissao} onChange={(e) => setProfissao(e.target.value)} placeholder="Ex: Terapeuta Ocupacional" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome do Conselho *">
              <input className={inputCls} value={conselhoNome} onChange={(e) => setConselhoNome(e.target.value)} placeholder="Ex: CRP, CREFITO, CRM" />
            </Field>
            <Field label="Número do Conselho *">
              <input className={inputCls} value={conselhoNumero} onChange={(e) => setConselhoNumero(e.target.value)} placeholder="Ex: 12345/SP" />
            </Field>
          </div>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div>
        <SectionTitle>Dados Pessoais</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CPF">
            <input className={inputCls} value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00" inputMode="numeric" />
          </Field>
          <Field label="Telefone">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000" inputMode="tel" />
          </Field>
          <Field label="Sexo">
            <select className={inputCls} value={sexo} onChange={(e) => setSexo(e.target.value)}>
              <option value="nao_informado">Não informado</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <SectionTitle>Endereço</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={cepLoading ? "CEP — buscando…" : "CEP"}>
              <input className={inputCls} value={zip}
                onChange={(e) => { const m = maskCep(e.target.value); setZip(m); lookupCep(m); }}
                placeholder="00000-000" inputMode="numeric" />
            </Field>
            <Field label="Estado (UF)">
              <select className={inputCls} value={uf} onChange={(e) => setUf(e.target.value)}>
                <option value="">Selecione</option>
                {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Logradouro">
            <input className={inputCls} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua, Avenida…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Número">
              <input className={inputCls} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" />
            </Field>
            <Field label="Complemento">
              <input className={inputCls} value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, Sala…" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bairro">
              <input className={inputCls} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" />
            </Field>
            <Field label="Cidade">
              <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
            </Field>
          </div>
        </div>
      </div>

      {/* Formação Acadêmica */}
      <div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
          <SectionTitle>Formação Acadêmica</SectionTitle>
        </div>
        <DynamicList
          items={formacoes}
          setter={setFormacoes}
          addLabel="+ Adicionar formação"
          placeholder="Ex: Bacharelado em Terapia Ocupacional — USP (2018)"
          attachLabel="Anexar diploma"
        />
      </div>

      {/* Especialidades */}
      <div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
          <SectionTitle>Especialidades</SectionTitle>
        </div>
        <DynamicList
          items={especialidades}
          setter={setEspecialidades}
          addLabel="+ Adicionar especialidade"
          placeholder="Ex: Autismo, TDAH, Integração Sensorial…"
          attachLabel="Anexar certificado"
        />
      </div>

      {/* Cursos */}
      <div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
          <SectionTitle>Cursos</SectionTitle>
        </div>
        <DynamicList
          items={courses}
          setter={setCourses}
          addLabel="+ Adicionar curso"
          placeholder="Nome do curso"
          attachLabel="Certificado"
        />
      </div>

      {/* Feedback */}
      {erro && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-600 font-medium" style={{ backgroundColor: "#FFF0F3" }}>
          {erro}
        </div>
      )}
      {success && (
        <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#4CAF50" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Alterações salvas com sucesso!
        </p>
      )}

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

function DocFileRow({
  label,
  existingUrl,
  currentFile,
  onFile,
}: {
  label: string;
  existingUrl?: string;
  currentFile?: File;
  onFile: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const name = currentFile?.name ?? (existingUrl ? existingUrl.split("/").pop() : null);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        {label}
      </button>
      {name && (
        <span className="text-xs text-gray-400 truncate max-w-[160px]" title={name}>{name}</span>
      )}
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

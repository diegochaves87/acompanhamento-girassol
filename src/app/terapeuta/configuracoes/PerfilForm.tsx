"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

type Course = { name: string; file?: File; file_url?: string };

type ProfileData = {
  cpf?: string;
  phone?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  education?: string;
  education_file_url?: string;
  specialties?: string;
  specialties_file_url?: string;
  courses?: Array<{ name: string; file_url?: string }>;
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

export default function PerfilForm({
  userId,
  email,
  initialName,
  initialProfession,
  initialSpecialty,
  profileData,
}: Props) {
  const [nome, setNome] = useState(initialName);
  const [profissao, setProfissao] = useState(initialProfession);
  const [especialidade, setEspecialidade] = useState(initialSpecialty);

  const [cpf, setCpf] = useState(maskCpf(profileData.cpf ?? ""));
  const [phone, setPhone] = useState(maskPhone(profileData.phone ?? ""));

  const [zip, setZip] = useState(maskCep(profileData.address_zip ?? ""));
  const [street, setStreet] = useState(profileData.address_street ?? "");
  const [number, setNumber] = useState(profileData.address_number ?? "");
  const [complement, setComplement] = useState(profileData.address_complement ?? "");
  const [neighborhood, setNeighborhood] = useState(profileData.address_neighborhood ?? "");
  const [city, setCity] = useState(profileData.address_city ?? "");
  const [uf, setUf] = useState(profileData.address_state ?? "");
  const [cepLoading, setCepLoading] = useState(false);

  const [education, setEducation] = useState(profileData.education ?? "");
  const [educationFile, setEducationFile] = useState<File | null>(null);
  const [educationFileUrl, setEducationFileUrl] = useState(profileData.education_file_url ?? "");
  const eduFileRef = useRef<HTMLInputElement>(null);

  const [specialties, setSpecialties] = useState(profileData.specialties ?? "");
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [specFileUrl, setSpecFileUrl] = useState(profileData.specialties_file_url ?? "");
  const specFileRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<Course[]>(
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
    if (error) {
      console.warn("Upload falhou:", error.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  async function handleSave() {
    setSaving(true);
    setErro("");
    setSuccess(false);
    const supabase = createClient();

    let eduUrl = educationFileUrl;
    if (educationFile) {
      const url = await uploadFile(educationFile, "education");
      if (url) { eduUrl = url; setEducationFileUrl(url); }
    }

    let spUrl = specFileUrl;
    if (specFile) {
      const url = await uploadFile(specFile, "specialties");
      if (url) { spUrl = url; setSpecFileUrl(url); }
    }

    const coursesResult = await Promise.all(
      courses.map(async (c, i) => {
        let url = c.file_url;
        if (c.file) {
          const uploaded = await uploadFile(c.file, `course-${i}`);
          if (uploaded) url = uploaded;
        }
        return { name: c.name, file_url: url };
      })
    );

    await supabase
      .from("users")
      .update({ full_name: nome.trim(), profession: profissao.trim(), specialty: especialidade.trim() })
      .eq("id", userId);

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: nome.trim(),
        cpf: cpf.replace(/\D/g, ""),
        phone: phone.replace(/\D/g, ""),
        address_street: street,
        address_number: number,
        address_complement: complement,
        address_neighborhood: neighborhood,
        address_city: city,
        address_state: uf,
        address_zip: zip.replace(/\D/g, ""),
        education,
        education_file_url: eduUrl,
        specialties,
        specialties_file_url: spUrl,
        courses: coursesResult,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) setErro(error.message);
    else setSuccess(true);
    setSaving(false);
  }

  function addCourse() {
    setCourses((prev) => [...prev, { name: "" }]);
  }

  function removeCourse(i: number) {
    setCourses((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateCourseName(i: number, name: string) {
    setCourses((prev) => prev.map((c, idx) => (idx === i ? { ...c, name } : c)));
  }

  function updateCourseFile(i: number, file: File) {
    setCourses((prev) => prev.map((c, idx) => (idx === i ? { ...c, file } : c)));
  }

  function FileUploadRow({
    label,
    fileRef,
    onFile,
    existingUrl,
    currentFile,
  }: {
    label: string;
    fileRef: React.RefObject<HTMLInputElement>;
    onFile: (f: File) => void;
    existingUrl?: string;
    currentFile?: File | null;
  }) {
    const name = currentFile?.name ?? (existingUrl ? existingUrl.split("/").pop() : null);
    return (
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
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
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </div>
    );
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
        </div>
      </div>

      {/* Dados Pessoais */}
      <div>
        <SectionTitle>Dados Pessoais</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CPF">
            <input
              className={inputCls}
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </Field>
          <Field label="Telefone">
            <input
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </Field>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <SectionTitle>Endereço</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={cepLoading ? "CEP — buscando…" : "CEP"}>
              <input
                className={inputCls}
                value={zip}
                onChange={(e) => {
                  const masked = maskCep(e.target.value);
                  setZip(masked);
                  lookupCep(masked);
                }}
                placeholder="00000-000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Estado (UF)">
              <select
                className={inputCls}
                value={uf}
                onChange={(e) => setUf(e.target.value)}
              >
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
        <SectionTitle>Formação Acadêmica</SectionTitle>
        <Field label="Formação">
          <input
            className={inputCls}
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="Ex: Bacharelado em Terapia Ocupacional — USP (2018)"
          />
        </Field>
        <FileUploadRow
          label="Anexar diploma"
          fileRef={eduFileRef}
          onFile={setEducationFile}
          existingUrl={educationFileUrl}
          currentFile={educationFile}
        />
      </div>

      {/* Especialidades */}
      <div>
        <SectionTitle>Especialidades</SectionTitle>
        <Field label="Especialidades">
          <input
            className={inputCls}
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
            placeholder="Ex: Autismo, TDAH, Integração Sensorial"
          />
        </Field>
        <Field label="">
          <input
            className={`${inputCls} mt-3`}
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            placeholder="Outras especialidades / detalhamento"
          />
        </Field>
        <FileUploadRow
          label="Anexar certificado"
          fileRef={specFileRef}
          onFile={setSpecFile}
          existingUrl={specFileUrl}
          currentFile={specFile}
        />
      </div>

      {/* Cursos */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <SectionTitle>Cursos</SectionTitle>
          <button
            type="button"
            onClick={addCourse}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 -mt-2"
            style={{ backgroundColor: "#4CAF50" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </button>
        </div>

        {courses.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum curso adicionado. Clique em Adicionar.</p>
        )}

        <div className="space-y-3">
          {courses.map((c, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/10 bg-white"
                    value={c.name}
                    onChange={(e) => updateCourseName(i, e.target.value)}
                    placeholder="Nome do curso"
                  />
                  <button
                    type="button"
                    onClick={() => removeCourse(i)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    style={{ color: "#EF4444" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <CourseFileRow
                  existingUrl={c.file_url}
                  currentFile={c.file}
                  onFile={(f) => updateCourseFile(i, f)}
                />
              </div>
          ))}
        </div>
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

function CourseFileRow({
  existingUrl,
  currentFile,
  onFile,
}: {
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
        Certificado
      </button>
      {name && <span className="text-xs text-gray-400 truncate max-w-[150px]" title={name}>{name}</span>}
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

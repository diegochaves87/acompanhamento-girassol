import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const cards = [
  {
    title: "Pacientes",
    description: "Gerencie seus pacientes ativos",
    href: "/terapeuta/pacientes",
    color: "#4CAF50",
    bgColor: "#F0FFF4",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m4-4a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      </svg>
    ),
  },
  {
    title: "Agenda",
    description: "Consulte e organize seus atendimentos",
    href: "/terapeuta/agenda",
    color: "#2E7BC1",
    bgColor: "#EFF6FF",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
      </svg>
    ),
  },
  {
    title: "Financeiro",
    description: "Acompanhe pagamentos e receitas",
    href: "/terapeuta/financeiro",
    color: "#FFBA3D",
    bgColor: "#FFFBEB",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
  {
    title: "Evoluções",
    description: "Analise, registre e publique as evoluções dos atendimentos",
    href: "/terapeuta/evolucoes",
    color: "#8E6CCF",
    bgColor: "#F3F0FF",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
      </svg>
    ),
  },
  {
    title: "Clínicas",
    description: "Gerencie os locais onde você atende",
    href: "/terapeuta/clinicas",
    color: "#FF5C7A",
    bgColor: "#FFF0F3",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default async function TerapeutaDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let nome = "Terapeuta";
  let saudacao = "Bem-vindo(a) de volta,";
  if (user) {
    const [usersRes, profileRes] = await Promise.all([
      supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("sexo").eq("id", user.id).maybeSingle(),
    ]);
    nome = usersRes.data?.full_name ?? "Terapeuta";
    const sexo = profileRes.data?.sexo ?? "nao_informado";
    if (sexo === "masculino") saudacao = "Bem-vindo de volta,";
    else if (sexo === "feminino") saudacao = "Bem-vinda de volta,";
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <main className="max-w-4xl mx-auto px-5 py-8">

        {/* Banner de boas-vindas */}
        <div
          className="relative rounded-2xl px-7 py-7 mb-8 overflow-hidden"
          style={{ backgroundColor: "#FFF7E6" }}
        >
          {/* Decorações SVG */}
          <div
            className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none select-none"
            aria-hidden="true"
          >
            {/* folha verde */}
            <svg className="absolute top-3 right-12" width="26" height="32" viewBox="0 0 26 32" fill="none">
              <path d="M13 2C13 2 24 9 24 18C24 25 19.5 30 13 30C6.5 30 2 25 2 18C2 9 13 2 13 2Z" fill="#4CAF50" opacity="0.75" />
              <line x1="13" y1="4" x2="13" y2="28" stroke="#2E7D32" strokeWidth="1.2" strokeOpacity="0.4" />
            </svg>
            {/* coração dashed roxo */}
            <svg className="absolute top-5 right-28" width="22" height="20" viewBox="0 0 22 20" fill="none">
              <path
                d="M11 18L2.5 10C0.5 8 0.5 5 2.5 3.5C4.5 2 7 2.5 8.5 4.5L11 7L13.5 4.5C15 2.5 17.5 2 19.5 3.5C21.5 5 21.5 8 19.5 10Z"
                stroke="#8E6CCF" strokeWidth="1.5" strokeDasharray="2.5 1.5" fill="none"
              />
            </svg>
            {/* pétalas amarelas */}
            <svg className="absolute bottom-4 right-16" width="32" height="32" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="6" rx="3.5" ry="6" fill="#FFBA3D" opacity="0.65" transform="rotate(0 16 16)" />
              <ellipse cx="16" cy="6" rx="3.5" ry="6" fill="#FFBA3D" opacity="0.65" transform="rotate(72 16 16)" />
              <ellipse cx="16" cy="6" rx="3.5" ry="6" fill="#FFBA3D" opacity="0.65" transform="rotate(144 16 16)" />
              <ellipse cx="16" cy="6" rx="3.5" ry="6" fill="#FFBA3D" opacity="0.65" transform="rotate(216 16 16)" />
              <ellipse cx="16" cy="6" rx="3.5" ry="6" fill="#FFBA3D" opacity="0.65" transform="rotate(288 16 16)" />
              <circle cx="16" cy="16" r="3.5" fill="#FFBA3D" opacity="0.65" />
            </svg>
            {/* semicírculo azul */}
            <svg className="absolute bottom-0 right-0" width="40" height="20" viewBox="0 0 40 20" fill="none">
              <path d="M0 20C0 9 9 0 20 0C31 0 40 9 40 20Z" fill="#1D3557" opacity="0.7" />
            </svg>
          </div>

          <p className="text-sm font-semibold mb-1" style={{ color: "#4CAF50" }}>
            {saudacao}
          </p>
          <div className="flex items-center gap-2">
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: 32, color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
            >
              {nome}
            </h1>
            <span
              style={{ color: "#FFBA3D", fontSize: 14, letterSpacing: "0.15em" }}
              aria-hidden="true"
            >
              ★ ★ ★
            </span>
          </div>
          <p className="text-xs mt-1.5 max-w-xs" style={{ color: "#6B7280" }}>
            Que bom ter você aqui! Vamos continuar transformando vidas juntos.
          </p>
        </div>

        {/* Cards de módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-white rounded-2xl border flex items-center gap-4 p-5 hover:shadow-md transition-shadow"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: card.bgColor, color: card.color }}
              >
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="font-semibold text-sm mb-0.5"
                  style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
                >
                  {card.title}
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                  {card.description}
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 flex-shrink-0 opacity-70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                style={{ color: card.color }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Card de ajuda */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{ backgroundColor: "#F3F0FF" }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#E9E4F8", color: "#8E6CCF" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "#8E6CCF" }}>Precisa de ajuda?</p>
            <p className="text-xs mt-0.5" style={{ color: "#8E6CCF", opacity: 0.75 }}>
              Acesse a seção &ldquo;Quem Somos&rdquo; ou fale com o suporte.
            </p>
          </div>
          <Link
            href="/terapeuta/sobre"
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#E9E4F8", color: "#8E6CCF" }}
          >
            Ver mais
          </Link>
        </div>

      </main>
    </div>
  );
}

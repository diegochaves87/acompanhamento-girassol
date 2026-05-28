import PageHeader from "@/components/PageHeader";

export default function SobrePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <PageHeader
        title="Quem Somos"
        backHref="/terapeuta"
        backLabel="Início"
        iconColor="#FFBA3D"
        maxWidth="max-w-3xl"
        subtitle="Conheça a história e as pessoas por trás do Acompanhamento Girassol"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.8} />
            <path d="M12 3C12 3 9.5 6 9.5 9M12 3C12 3 14.5 6 14.5 9M12 21C12 21 9.5 18 9.5 15M12 21C12 21 14.5 18 14.5 15M3 12C3 12 6 9.5 9 9.5M3 12C3 12 6 14.5 9 14.5M21 12C21 12 18 9.5 15 9.5M21 12C21 12 18 14.5 15 14.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
        }
      />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* O que é */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#EFF6FF", color: "#2E7BC1" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "#1D3557" }}>
              O que é
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            O Acompanhamento Girassol é uma plataforma criada para fortalecer o vínculo entre terapeuta, paciente e família. Aqui, cada sessão, cada evolução e cada conquista são registradas com cuidado, formando um histórico vivo do percurso terapêutico.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            A proposta é simples: tornar o processo terapêutico mais transparente, humano e conectado, para que ninguém precise caminhar sozinho nessa jornada.
          </p>
        </div>

        {/* Como surgiu */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#F5F3FF", color: "#8E6CCF" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "#1D3557" }}>
              Como surgiu
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Entre um atendimento e outro, no ritmo acelerado da rotina clínica, a Fisioterapeuta Thaís Freitas percebia algo que a movia: havia muito mais a oferecer do que o tempo permitia. Terapeutas com o coração cheio de coisas importantes para compartilhar, famílias igualmente ansiosas por participar mais ativamente, e uma equipe multidisciplinar que, apesar do comprometimento, encontrava poucos momentos para trocar informações que poderiam transformar um tratamento.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Cada detalhe que não chegava à família, cada observação que não alcançava o colega de equipe, representava uma oportunidade de impulsionar ainda mais o desenvolvimento do paciente. E para a Dra. Thaís Freitas, enxergar uma oportunidade de melhorar a vida de alguém e não agir simplesmente não era uma opção.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Ela foi além. Buscou um desenvolvedor que acreditasse no mesmo sonho, e juntos construíram o Acompanhamento Girassol, uma plataforma pensada de dentro para fora, nascida da vivência real de quem está presente em cada sessão, todos os dias.
          </p>
        </div>

        {/* Quem é Thaís */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#F0FFF4", color: "#4CAF50" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "#1D3557" }}>
              Quem é Thaís Freitas
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/identidade-visual/thais-freitas.jpg"
              alt="Thaís Freitas"
              className="w-28 h-28 rounded-2xl object-cover flex-shrink-0 self-start"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <p className="font-bold text-sm" style={{ color: "#1D3557" }}>Thaís Emanuelle Martins de Freitas</p>
              <p className="text-xs text-gray-500 mt-1">Fisioterapeuta · Especialista em Psicomotricidade · Idealizadora do Acompanhamento Girassol</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            Nascida em Mossoró, no Rio Grande do Norte, Thaís cresceu em Aracati, no interior do Ceará, cidade que escolheu para chamar de lar até hoje. Fisioterapeuta especializada em psicomotricidade, carregou desde cedo uma certeza: cuidar do outro é mais do que uma profissão, é um propósito.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Foi na psicomotricidade que encontrou o que tanto buscava. Uma prática que enxerga a criança por inteiro: seu movimento, suas emoções, sua história. Uma abordagem onde cada detalhe é valorizado, e cada pequena conquista é celebrada como o grande avanço que realmente é.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Mãe, esposa e profissional apaixonada pelo que faz, a Dra. Thaís une na vida aquilo que vive na clínica: presença, atenção e cuidado genuíno. O Acompanhamento Girassol nasceu de tudo isso, de suas experiências, de sua sensibilidade e da crença inabalável de que a tecnologia pode, sim, servir ao cuidado humano.
          </p>
          <blockquote
            className="mt-5 text-sm italic text-gray-500"
            style={{ borderLeft: "4px solid #FFBA3D", paddingLeft: 16 }}
          >
            "Não fui desenvolvedora, não fui programadora. Fui apenas uma terapeuta que acreditou que era possível fazer diferente e ajudar meus colegas de profissão e, principalmente, o desenvolvimento dos meus pacientes."
          </blockquote>
        </div>

      </main>
    </div>
  );
}

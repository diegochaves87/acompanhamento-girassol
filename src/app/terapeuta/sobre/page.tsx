import PageHeader from "@/components/PageHeader";

export default function SobrePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <PageHeader
        title="Quem Somos"
        backHref="/terapeuta"
        backLabel="Início"
        maxWidth="max-w-3xl"
        subtitle="Conheça a história por trás do Acompanhamento Girassol"
      />

      <main className="max-w-3xl mx-auto px-3 py-6 sm:px-6 sm:py-8 space-y-6">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold mb-3" style={{ color: "#1a4a3a" }}>O que é a Plataforma</h2>
          <p className="text-sm text-gray-600 leading-relaxed">O Acompanhamento Girassol é uma plataforma criada para fortalecer o vínculo entre terapeuta, paciente e família. Aqui, cada sessão, cada evolução e cada conquista são registradas com cuidado, formando um histórico vivo do percurso terapêutico.</p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">A proposta é simples: tornar o processo terapêutico mais transparente, humano e conectado, para que ninguém precise caminhar sozinho nessa jornada.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold mb-3" style={{ color: "#1a4a3a" }}>Como surgiu</h2>
          <p className="text-sm text-gray-600 leading-relaxed">Entre um atendimento e outro, no ritmo acelerado da rotina clínica, a Fisioterapeuta Thaís Freitas percebia algo que a movia: havia muito mais a oferecer do que o tempo permitia. Terapeutas com o coração cheio de coisas importantes para compartilhar, famílias igualmente ansiosas por participar mais ativamente, e uma equipe multidisciplinar que, apesar do comprometimento, encontrava poucos momentos para trocar informações que poderiam transformar um tratamento.</p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">Cada detalhe que não chegava à família, cada observação que não alcançava o colega de equipe, representava uma oportunidade de impulsionar ainda mais o desenvolvimento do paciente. E para a Dra. Thaís Freitas, enxergar uma oportunidade de melhorar a vida de alguém e não agir simplesmente não era uma opção.</p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">Ela foi além. Buscou um desenvolvedor que acreditasse no mesmo sonho, e juntos construíram o Acompanhamento Girassol, uma plataforma pensada de dentro para fora, nascida da vivência real de quem está presente em cada sessão, todos os dias.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold mb-4" style={{ color: "#1a4a3a" }}>Quem é Thaís Freitas</h2>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Foto-Thais.jpeg" alt="Thaís Freitas" className="w-28 h-28 rounded-2xl object-cover object-top flex-shrink-0" />
            <div>
              <p className="font-bold text-sm" style={{ color: "#1D3557" }}>Thaís Emanuelle Martins de Freitas</p>
              <p className="text-xs text-gray-500 mt-1">Fisioterapeuta · Especialista em Psicomotricidade · Idealizadora do Acompanhamento Girassol</p>
              <a href="https://www.instagram.com/thaisfreitasfisio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium mt-2" style={{ color: "#E1306C" }}>@thaisfreitasfisio</a>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">Nascida em Mossoró, no Rio Grande do Norte, Thaís cresceu em Aracati, no interior do Ceará, cidade que escolheu para chamar de lar até hoje. Fisioterapeuta especializada em psicomotricidade, carregou desde cedo uma certeza: cuidar do outro é mais do que uma profissão, é um propósito.</p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">Foi na psicomotricidade que encontrou o que tanto buscava. Uma prática que enxerga a criança por inteiro: seu movimento, suas emoções, sua história. Uma abordagem onde cada detalhe é valorizado, e cada pequena conquista é celebrada como o grande avanço que realmente é.</p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">Mãe, esposa e profissional apaixonada pelo que faz, a Dra. Thaís une na vida aquilo que vive na clínica: presença, atenção e cuidado genuíno. O Acompanhamento Girassol nasceu de tudo isso, de suas experiências, de sua sensibilidade e da crença inabalável de que a tecnologia pode, sim, servir ao cuidado humano.</p>
          <blockquote className="mt-5 text-sm italic text-gray-500" style={{ borderLeft: "4px solid #FFBA3D", paddingLeft: 16 }}>&ldquo;Não fui desenvolvedora, não fui programadora. Fui apenas uma terapeuta que acreditou que era possível fazer diferente e ajudar meus colegas de profissão e, principalmente, o desenvolvimento dos meus pacientes.&rdquo;</blockquote>
        </div>

      </main>
    </div>
  );
}

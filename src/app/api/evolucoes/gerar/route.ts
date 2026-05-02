import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { technicalText, patientName, guardianName, guardianRelationship } =
    await request.json();

  if (!technicalText?.trim()) {
    return Response.json(
      { error: "Texto técnico obrigatório." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const guardianDesc =
    guardianRelationship || guardianName
      ? [guardianRelationship, guardianName].filter(Boolean).join(" ")
      : "responsável";

  const addressTitle = guardianRelationship ?? "Responsável";

  const prompt = `Você é uma assistente que ajuda terapeutas a comunicar o progresso do atendimento para as famílias dos pacientes de forma clara, acolhedora e estruturada.

Transforme o texto técnico abaixo em uma mensagem para o(a) ${guardianDesc} de ${patientName}.

Regras obrigatórias:
- Proibido usar travessão em qualquer parte do texto (nem " - " nem "--")
- Linguagem simples, calorosa e acessível, sem jargão técnico
- Dirija-se sempre ao(a) ${addressTitle} de forma direta
- Máximo de 300 palavras no total
- Use exatamente os cinco títulos em negrito abaixo, nessa ordem, sem adicionar nem remover nenhum

Estrutura obrigatória (copie os títulos exatamente como estão):

**Como foi a sessão**
[parágrafo descrevendo o atendimento e o que foi trabalhado]

**O que observamos hoje**
[parágrafo sobre comportamentos, avanços e dificuldades observadas]

**Dicas para o dia a dia**
[2 a 3 sugestões práticas que a família pode aplicar em casa, em forma de texto corrido sem marcadores]

**Sua participação faz diferença**
[parágrafo motivacional pedindo feedback sobre como foi a semana da criança em casa]

**Até a próxima sessão**
[encerramento acolhedor com expectativas para o próximo encontro]

Texto técnico:
${technicalText}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return Response.json(
      { error: `Erro na API Anthropic: ${errText}` },
      { status: 500 }
    );
  }

  const data = await response.json();
  const familyText: string = data.content?.[0]?.text ?? "";

  return Response.json({ familyText });
}

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
    [guardianRelationship, guardianName].filter(Boolean).join(", ") ||
    "responsável pelo paciente";

  const prompt = `Você é uma assistente que ajuda fisioterapeutas a comunicar o progresso do tratamento para as famílias dos pacientes de forma clara e acolhedora.

Transforme o texto técnico abaixo em uma mensagem calorosa para ser enviada ao(a) ${guardianDesc} de ${patientName}.

Regras obrigatórias:
- Linguagem simples, calorosa e acessível, sem jargão técnico
- Proibido usar travessão em qualquer parte do texto
- Dirija-se ao responsável de forma direta e pessoal (ex: "Como mãe da ${patientName}...")
- Inclua de 2 a 3 dicas práticas que a família pode aplicar no dia a dia em casa
- Tom positivo, encorajador e empático
- Parágrafos curtos e bem espaçados
- Não use listas com marcadores, escreva em forma de texto corrido

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
      max_tokens: 1024,
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

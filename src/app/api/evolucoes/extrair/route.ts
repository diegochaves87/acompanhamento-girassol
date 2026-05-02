import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { base64, mimeType } = await request.json();

  if (!base64) {
    return Response.json({ error: "Arquivo obrigatório." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: mimeType ?? "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Extraia e retorne apenas o texto deste documento, mantendo a estrutura e parágrafos originais. Não adicione comentários, títulos ou formatação extra.",
            },
          ],
        },
      ],
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
  const text: string = data.content?.[0]?.text ?? "";

  return Response.json({ text });
}

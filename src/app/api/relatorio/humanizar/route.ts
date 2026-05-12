import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const HUMANIZAR_PROMPT = `Você é um comunicador empático especializado em traduzir relatórios clínicos para famílias.
Transforme o relatório técnico em uma mensagem acolhedora para os pais/responsáveis.

REGRAS:
- Sem jargões técnicos — use linguagem simples e afetiva
- Tom: acolhedor, esperançoso, honesto sem ser alarmante
- Máximo 3 parágrafos curtos
- Estrutura: 1) Como a criança está hoje, 2) O que estamos trabalhando juntos, 3) O que a família pode fazer em casa
- Terminar com uma frase encorajadora
- Sem markdown, sem tópicos, texto corrido
- Não inclua assinatura (o profissional irá assinar ao compartilhar)`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { conteudo } = (await req.json()) as { conteudo: string };
  if (!conteudo?.trim()) {
    return Response.json({ error: "Conteúdo não fornecido." }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: HUMANIZAR_PROMPT,
      messages: [
        {
          role: "user",
          content: `Transforme este relatório clínico em uma mensagem acolhedora para a família:\n\n${conteudo}`,
        },
      ],
    });
    const block = msg.content[0];
    if (block.type !== "text") {
      return Response.json({ error: "Resposta inesperada da IA." }, { status: 500 });
    }
    return Response.json({ texto: block.text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[/api/relatorio/humanizar] Anthropic error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { conteudo, familiar_nome, familiar_parentesco } = (await req.json()) as {
    conteudo: string;
    familiar_nome?: string;
    familiar_parentesco?: string;
  };

  if (!conteudo?.trim()) {
    return Response.json({ error: "Conteúdo não fornecido." }, { status: 400 });
  }

  const nome = familiar_nome?.trim() || "família";
  const parentesco = familiar_parentesco?.trim() || "responsável";

  const systemPrompt = `Você é um comunicador empático especializado em traduzir relatórios clínicos para famílias.
Transforme o relatório técnico em uma mensagem acolhedora dirigida diretamente ao familiar responsável.

REGRAS:
- Iniciar com: "Olá, ${nome}!"
- Tratar pelo parentesco: se for mãe/pai usar "você, como ${parentesco}", adaptando naturalmente para avó/avô ou outros
- Sem jargões técnicos — linguagem simples e afetiva
- Tom: acolhedor, esperançoso, honesto sem ser alarmante
- Máximo 3 parágrafos curtos
- Estrutura: 1) Como a criança está hoje, 2) O que estamos trabalhando juntos, 3) O que você pode fazer em casa para apoiar
- Terminar com uma frase encorajadora dirigida a ${nome}
- Sem markdown, sem tópicos, texto corrido
- Assinar com o nome do profissional`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Familiar: ${nome} (${parentesco})\n\nTransforme este relatório clínico em uma mensagem personalizada para ${nome}:\n\n${conteudo}`,
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

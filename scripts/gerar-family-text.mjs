import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ─── Carrega .env.local ───────────────────────────────────────────────────────
function loadEnv(path) {
  try {
    const lines = readFileSync(path, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // arquivo não encontrado — assume variáveis já no ambiente
  }
}
loadEnv(".env.local");

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const TENANT_ID     = "00000000-0000-0000-0000-000000000001";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local");
  process.exit(1);
}
if (!ANTHROPIC_KEY) {
  console.error("❌  ANTHROPIC_API_KEY não encontrada em .env.local — adicione a chave e tente novamente.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Busca evoluções sem family_text ─────────────────────────────────────────
const { data: evolucoes, error: fetchErr } = await supabase
  .from("evolutions")
  .select(`
    id,
    technical_text,
    patient_id,
    patients!inner ( full_name )
  `)
  .eq("tenant_id", TENANT_ID)
  .is("family_text", null)
  .not("technical_text", "is", null);

if (fetchErr) {
  console.error("❌  Erro ao buscar evoluções:", fetchErr.message);
  process.exit(1);
}

if (!evolucoes || evolucoes.length === 0) {
  console.log("✅  Nenhuma evolução pendente de family_text.");
  process.exit(0);
}

console.log(`\n🌻  ${evolucoes.length} evoluções para processar.\n`);

// ─── Processa cada evolução ───────────────────────────────────────────────────
let ok = 0;
let fail = 0;

for (let i = 0; i < evolucoes.length; i++) {
  const ev = evolucoes[i];
  const patientName = ev.patients?.full_name ?? "Paciente";

  console.log(`Processando ${i + 1}/${evolucoes.length}: ${patientName}...`);

  // Busca responsável
  const { data: fp } = await supabase
    .from("family_patient")
    .select("guardian_name, guardian_relationship")
    .eq("patient_id", ev.patient_id)
    .maybeSingle();

  const guardianName         = fp?.guardian_name ?? null;
  const guardianRelationship = fp?.guardian_relationship ?? null;
  const guardianDesc =
    [guardianRelationship, guardianName].filter(Boolean).join(" ") || "responsável";
  const addressTitle = guardianRelationship ?? "Responsável";

  // Monta prompt idêntico ao da rota
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
${ev.technical_text}`;

  // Chama Anthropic
  let familyText = null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    familyText = data.content?.[0]?.text ?? null;
  } catch (err) {
    console.error(`  ⚠️  Erro na API Anthropic: ${err.message}`);
    fail++;
    await new Promise((r) => setTimeout(r, 500));
    continue;
  }

  if (!familyText) {
    console.error("  ⚠️  Resposta vazia da API.");
    fail++;
    await new Promise((r) => setTimeout(r, 500));
    continue;
  }

  // Salva no Supabase
  const { error: updateErr } = await supabase
    .from("evolutions")
    .update({ family_text: familyText })
    .eq("id", ev.id);

  if (updateErr) {
    console.error(`  ⚠️  Erro ao salvar: ${updateErr.message}`);
    fail++;
  } else {
    console.log(`  ✅  Salvo.`);
    ok++;
  }

  // Aguarda 500ms entre chamadas
  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\n🏁  Concluído: ${ok} gerados, ${fail} falhas.`);

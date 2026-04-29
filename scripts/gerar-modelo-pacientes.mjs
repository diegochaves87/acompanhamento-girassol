import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const cabecalhos = [
  "Nome Completo",
  "Data de Nascimento",
  "Diagnóstico",
  "Nome do Responsável",
  "Telefone do Responsável",
  "Email do Responsável",
  "Parentesco",
  "Clínica",
  "Tipo de Pagamento",
  "Valor por Sessão",
  "Convênio",
  "Observações",
];

const exemplo = [
  "Maria Silva Santos",
  "12/05/2015",
  "TEA - Transtorno do Espectro Autista",
  "Ana Paula Santos",
  "(11) 98765-4321",
  "ana.santos@email.com",
  "Mãe",
  "Clínica Girassol",
  "particular",
  "150,00",
  "",
  "Paciente com boa evolução nas sessões de ABA",
];

const ws = XLSX.utils.aoa_to_sheet([cabecalhos, exemplo]);

// Larguras das colunas
ws["!cols"] = [
  { wch: 28 }, // Nome Completo
  { wch: 20 }, // Data de Nascimento
  { wch: 35 }, // Diagnóstico
  { wch: 28 }, // Nome do Responsável
  { wch: 22 }, // Telefone do Responsável
  { wch: 30 }, // Email do Responsável
  { wch: 14 }, // Parentesco
  { wch: 22 }, // Clínica
  { wch: 20 }, // Tipo de Pagamento
  { wch: 16 }, // Valor por Sessão
  { wch: 20 }, // Convênio
  { wch: 40 }, // Observações
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Pacientes");

const destino = join(__dirname, "../public/modelo-pacientes.xlsx");
XLSX.writeFile(wb, destino);
console.log("Arquivo gerado em public/modelo-pacientes.xlsx");

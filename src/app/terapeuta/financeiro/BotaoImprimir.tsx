"use client";

export type PrintMetrics = {
  receita: number;
  perdido: number;
  recuperado: number;
  presenca: number;
  totalAtend: number;
  totalFalta: number;
};

export type PrintPatient = {
  name: string;
  sessoes: number;
  faltas: number;
  receita: number;
  tipo: string;
  convenio: string | null;
};

export type PrintClinic = {
  name: string;
  sessoes: number;
  receita: number;
  atend: number;
  faltas: number;
  presenca: number;
  cancelamentos: number;
  reposicoes: number;
};

export type PrintData = {
  terapeutaNome: string;
  periodo: string;
  metrics: PrintMetrics;
  ticketMedio: number;
  receitaProjetada: number;
  patientRanking: PrintPatient[];
  clinicRanking: PrintClinic[];
  monthlyData: Array<{ label: string; value: number }>;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildReport(d: PrintData): string {
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const maxBar = Math.max(...d.monthlyData.map((m) => m.value), 1);

  const bars = d.monthlyData.map((m) => {
    const pct = Math.round((m.value / maxBar) * 120);
    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0">
        <span style="font-size:9px;color:#6B7280;text-align:center">${m.value > 0 ? brl(m.value) : ""}</span>
        <div style="flex:1;display:flex;align-items:flex-end;width:100%">
          <div style="width:100%;height:${pct}px;background:${m.value > 0 ? "#4CAF50" : "#E5E7EB"};border-radius:4px 4px 0 0"></div>
        </div>
        <span style="font-size:9px;color:#9CA3AF;white-space:nowrap">${m.label}</span>
      </div>`;
  }).join("");

  const topPatients = d.patientRanking.slice(0, 5).map((p, i) => `
    <tr style="border-bottom:1px solid #F3F4F6">
      <td style="padding:8px 12px;color:#374151">${i + 1}. ${p.name}</td>
      <td style="padding:8px 12px;text-align:center;color:#6B7280">${p.sessoes}</td>
      <td style="padding:8px 12px;text-align:center;color:#EF4444">${p.faltas}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:600;color:#1a4a3a">${brl(p.receita)}</td>
    </tr>`).join("");

  const clinics = d.clinicRanking.map((c) => `
    <tr style="border-bottom:1px solid #F3F4F6">
      <td style="padding:8px 12px;color:#374151">${c.name}</td>
      <td style="padding:8px 12px;text-align:center;color:#6B7280">${c.sessoes}</td>
      <td style="padding:8px 12px;text-align:center;color:#4CAF50">${c.presenca}%</td>
      <td style="padding:8px 12px;text-align:center;color:#EF4444">${c.faltas}</td>
      <td style="padding:8px 12px;text-align:center;color:#F59E0B">${c.cancelamentos}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:600;color:#1a4a3a">${brl(c.receita)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Financeiro — ${d.periodo}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; color:#1D3557; background:#fff; padding:32px; font-size:13px; }
  h1 { font-size:22px; font-weight:700; color:#1D3557; }
  h2 { font-size:13px; font-weight:600; color:#374151; margin-bottom:12px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { padding:8px 12px; text-align:left; font-size:10px; font-weight:600; color:#9CA3AF; background:#F9FAFB; }
  .section { margin-bottom:28px; }
  .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
  .kpi { background:#F9FAFB; border-radius:12px; padding:14px 16px; }
  .kpi-label { font-size:10px; color:#9CA3AF; margin-bottom:4px; }
  .kpi-value { font-size:18px; font-weight:700; }
  .kpi-sub { font-size:10px; color:#9CA3AF; margin-top:2px; }
  .header-bar { display:flex; align-items:center; justify-content:space-between; padding-bottom:16px; margin-bottom:24px; border-bottom:2px solid #4CAF50; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #E5E7EB; font-size:10px; color:#9CA3AF; text-align:center; }
  .card { background:#fff; border:1px solid #E5E7EB; border-radius:12px; overflow:hidden; }
  @media print {
    body { padding:16px; }
    .no-print { display:none; }
    @page { margin:15mm; }
  }
</style>
</head>
<body>
<div class="header-bar">
  <div>
    <div style="font-size:10px;color:#4CAF50;font-weight:600;margin-bottom:2px">ACOMPANHAMENTO GIRASSOL</div>
    <h1>Relatório Financeiro</h1>
    <div style="font-size:12px;color:#6B7280;margin-top:4px">${d.terapeutaNome} · ${d.periodo}</div>
  </div>
  <div style="text-align:right;font-size:11px;color:#9CA3AF">
    Gerado em ${today}<br>
    <span style="color:#4CAF50;font-weight:600">Girassol</span>
  </div>
</div>

<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">Receita realizada</div>
    <div class="kpi-value" style="color:#1a4a3a">${brl(d.metrics.receita)}</div>
    <div class="kpi-sub">${d.metrics.totalAtend} sessões realizadas</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Ticket médio</div>
    <div class="kpi-value" style="color:#2E7BC1">${brl(d.ticketMedio)}</div>
    <div class="kpi-sub">por sessão</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Presença média</div>
    <div class="kpi-value" style="color:#4CAF50">${d.metrics.presenca}%</div>
    <div class="kpi-sub">${d.metrics.totalFalta} falta${d.metrics.totalFalta !== 1 ? "s" : ""} no período</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Receita projetada</div>
    <div class="kpi-value" style="color:#8E6CCF">${brl(d.receitaProjetada)}</div>
    <div class="kpi-sub">sessões agendadas</div>
  </div>
</div>

<div class="kpi-grid" style="margin-bottom:28px">
  <div class="kpi">
    <div class="kpi-label">Perdido por faltas</div>
    <div class="kpi-value" style="color:#EF4444">${brl(d.metrics.perdido)}</div>
    <div class="kpi-sub">${d.metrics.totalFalta} ausência${d.metrics.totalFalta !== 1 ? "s" : ""}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Recuperado (repos.)</div>
    <div class="kpi-value" style="color:#F59E0B">${brl(d.metrics.recuperado)}</div>
    <div class="kpi-sub">reposições realizadas</div>
  </div>
</div>

<div class="section">
  <h2>Receita — últimos 6 meses</h2>
  <div class="card" style="padding:20px">
    <div style="display:flex;align-items:flex-end;gap:8px;height:140px">
      ${bars}
    </div>
  </div>
</div>

<div class="section">
  <h2>Top 5 pacientes mais rentáveis</h2>
  <div class="card">
    <table>
      <thead><tr>
        <th>Paciente</th>
        <th style="text-align:center">Sessões</th>
        <th style="text-align:center">Faltas</th>
        <th style="text-align:right">Receita</th>
      </tr></thead>
      <tbody>${topPatients || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9CA3AF">Sem dados</td></tr>'}</tbody>
    </table>
  </div>
</div>

<div class="section">
  <h2>Performance por clínica</h2>
  <div class="card">
    <table>
      <thead><tr>
        <th>Clínica</th>
        <th style="text-align:center">Sessões</th>
        <th style="text-align:center">Presença</th>
        <th style="text-align:center">Faltas</th>
        <th style="text-align:center">Cancelamentos</th>
        <th style="text-align:right">Receita</th>
      </tr></thead>
      <tbody>${clinics || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#9CA3AF">Sem dados</td></tr>'}</tbody>
    </table>
  </div>
</div>

<div class="footer">
  Gerado por Acompanhamento Girassol — www.acompanhamentogirassol.com.br
</div>

<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;
}

export default function BotaoImprimir({
  label = "Imprimir / PDF",
  data,
}: {
  label?: string;
  data?: PrintData;
}) {
  function handleClick() {
    if (!data) {
      window.print();
      return;
    }
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(buildReport(data));
      w.document.close();
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      {label}
    </button>
  );
}

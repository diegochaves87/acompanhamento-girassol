// ─── Types ───────────────────────────────────────────────────────────────────

export type PDFClinicStat = {
  name: string; pacientes: number; realizadas: number; reposicoes: number;
  faltasInj: number; faltasJust: number; faltas: number; cancelamentos: number;
  presenca: number; receita: number; perdido: number;
};

export type PDFPatientStat = {
  name: string; clinicName: string; diagnosis: string | null; tipo: string;
  realizadas: number; reposicoes: number; faltas: number; cancelamentos: number;
  presenca: number; receita: number; perdido: number;
};

export type PDFReposicao = {
  paciente: string;
  dataFalta: string;
  dataReposicao: string;
  statusOriginal: string;
  valor: number;
};

export type PDFRelatorioData = {
  profissional: { nome: string; especialidade?: string };
  periodo: string;
  periodoSlug: string;
  metrics: {
    receita: number; presenca: number;
    perdidoFaltas: number; perdidoCancelamentos: number;
    totalAtend: number; totalFalta: number;
    totalCancelamentos: number; totalReposicoes: number;
  };
  reposicaoCards: {
    perdidas: number; valorPerdidas: number;
    makeupAgendadas: number; valorMakeupAgendadas: number;
    repRealizadas: number; valorRepRealizadas: number;
    saldoQtd: number; saldoValor: number;
  };
  clinicStats: PDFClinicStat[];
  patientStatsByReceita: PDFPatientStat[];
  patientStatsByAssid: PDFPatientStat[];
  reposicoes: PDFReposicao[];
};

// ─── Generator ───────────────────────────────────────────────────────────────

export async function generateRelatorioFinanceiroPDF(data: PDFRelatorioData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 15;
  const CONTENT_W = PAGE_W - 2 * MARGIN;

  const VERDE:       [number, number, number] = [29,  53,  87];
  const AMARELO:     [number, number, number] = [255, 186, 61];
  const VERDE_CLARO: [number, number, number] = [76,  175, 80];
  const VERMELHO:    [number, number, number] = [255, 92,  122];
  const ROXO:        [number, number, number] = [142, 108, 207];
  const AZUL:        [number, number, number] = [46,  123, 193];
  const CINZA_CLARO: [number, number, number] = [248, 250, 252];
  const CINZA_MEIO:  [number, number, number] = [150, 150, 150];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Carrega SVG via canvas — retorna base64 e largura proporcional para h=24mm
  async function loadLogo(): Promise<{ base64: string; w: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ratio  = (img.naturalWidth || 300) / (img.naturalHeight || 100);
        const h      = 24;
        const w      = h * ratio;
        const canvas = document.createElement("canvas");
        canvas.width  = img.naturalWidth  || 300;
        canvas.height = img.naturalHeight || 100;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve({ base64: canvas.toDataURL("image/png"), w });
      };
      img.onerror = () => resolve({ base64: "", w: 58 });
      img.src = "/identidade-visual/logo-vetorizada.svg";
    });
  }

  const { base64: logoBase64, w: logoW } = await loadLogo();

  function addHeader() {
    // Fundo creme #FFF7E6, header 30mm
    doc.setFillColor(255, 247, 230);
    doc.rect(0, 0, PAGE_W, 30, "F");

    // Linha separadora amarela na base
    doc.setDrawColor(AMARELO[0], AMARELO[1], AMARELO[2]);
    doc.setLineWidth(0.8);
    doc.line(0, 30, PAGE_W, 30);

    // Logo centralizada verticalmente: y = (30 - 24) / 2 = 3
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 15, 3, logoW, 24);
      } catch {}
    }

    const rx = PAGE_W - MARGIN;

    // Nome: azul escuro #1D3557
    doc.setTextColor(29, 53, 87);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(data.profissional.nome, rx, 12, { align: "right" });

    if (data.profissional.especialidade) {
      // Especialidade: cinza #4A5568
      doc.setTextColor(74, 85, 104);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(data.profissional.especialidade, rx, 18, { align: "right" });
    }

    // Período: amarelo #FFBA3D
    doc.setTextColor(AMARELO[0], AMARELO[1], AMARELO[2]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Relatório Financeiro — ${data.periodo}`, rx, 25, { align: "right" });
  }

  function addFooter(pageNumber: number, totalPages: number) {
    const fy = PAGE_H - 12;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, fy, PAGE_W - MARGIN, fy);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(CINZA_MEIO[0], CINZA_MEIO[1], CINZA_MEIO[2]);
    doc.text("Informação confidencial — uso exclusivo do profissional", MARGIN, fy + 4);
    doc.text("Acompanhamento Girassol — www.acompanhamentogirassol.com.br", PAGE_W / 2, fy + 4, { align: "center" });
    doc.text(`Página ${pageNumber} de ${totalPages}`, PAGE_W - MARGIN, fy + 4, { align: "right" });
  }

  function addSectionTitle(titulo: string, y: number): number {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(VERDE[0], VERDE[1], VERDE[2]);
    doc.text(titulo, MARGIN, y);
    doc.setDrawColor(AMARELO[0], AMARELO[1], AMARELO[2]);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
    return y + 8;
  }

  function checkPageBreak(currentY: number, neededHeight: number): number {
    if (currentY + neededHeight > PAGE_H - 25) {
      doc.addPage();
      addHeader();
      return 35;
    }
    return currentY;
  }

  function fmtBRL(n: number): string {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function presStatusLabel(pct: number, faltas: number, realizadas: number, reposicoes: number): string {
    if (pct === 100 && faltas === 0 && realizadas + reposicoes > 0) return "Nunca faltou";
    if (pct >= 95) return "Excelente";
    if (pct >= 85) return "Otima";
    if (pct >= 75) return "Boa";
    return "Atencao";
  }

  // ── Start ──
  addHeader();
  let y = 33;

  const todayLong = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(CINZA_MEIO[0], CINZA_MEIO[1], CINZA_MEIO[2]);
  doc.text(`Gerado em ${todayLong}`, MARGIN, y);
  y += 8;

  // ── SEÇÃO: Resumo do período ──
  y = addSectionTitle("Resumo do período", y);

  const cardW = (CONTENT_W - 9) / 4;
  const cardH = 20;
  const resumoCards: { label: string; value: string; color: [number, number, number] }[] = [
    { label: "Receita realizada",      value: fmtBRL(data.metrics.receita),                                          color: VERDE_CLARO },
    { label: "Presença média",         value: `${data.metrics.presenca}%`,                                           color: AZUL },
    { label: "Perdido (faltas/cancel)", value: fmtBRL(data.metrics.perdidoFaltas + data.metrics.perdidoCancelamentos), color: VERMELHO },
    { label: "Reposições realizadas",  value: String(data.metrics.totalReposicoes),                                   color: ROXO },
  ];

  resumoCards.forEach((card, i) => {
    const cx = MARGIN + i * (cardW + 3);
    doc.setFillColor(CINZA_CLARO[0], CINZA_CLARO[1], CINZA_CLARO[2]);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, "F");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, "S");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, cx + cardW / 2, y + 11, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(card.label, cx + cardW / 2, y + 17, { align: "center" });
  });

  y += cardH + 8;

  // ── SEÇÃO: Faltas & Reposições ──
  const rc = data.reposicaoCards;
  if (rc.perdidas + rc.makeupAgendadas + rc.repRealizadas > 0) {
    y = checkPageBreak(y, 35);
    y = addSectionTitle("Faltas & Reposições", y);

    const c3W = (CONTENT_W - 6) / 3;
    const c3H = 18;
    const repCards: { label: string; value: string; sub: string; color: [number, number, number] }[] = [
      { label: "Sessões perdidas",      value: String(rc.perdidas),                                            sub: fmtBRL(rc.valorPerdidas),                                                                color: VERMELHO },
      { label: "Reposições agendadas",  value: String(rc.makeupAgendadas),                                     sub: fmtBRL(rc.valorMakeupAgendadas),                                                         color: ROXO },
      { label: "Saldo",                 value: `${rc.saldoQtd >= 0 ? "+" : ""}${rc.saldoQtd}`,                 sub: `${rc.saldoValor >= 0 ? "+" : ""}${fmtBRL(Math.abs(rc.saldoValor))}`,                    color: AMARELO },
    ];

    repCards.forEach((card, i) => {
      const cx = MARGIN + i * (c3W + 3);
      doc.setFillColor(CINZA_CLARO[0], CINZA_CLARO[1], CINZA_CLARO[2]);
      doc.roundedRect(cx, y, c3W, c3H, 2, 2, "F");
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, y, c3W, c3H, 2, 2, "S");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.text(card.value, cx + c3W / 2, y + 8, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.text(card.sub, cx + c3W / 2, y + 13, { align: "center" });
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(card.label, cx + c3W / 2, y + 17, { align: "center" });
    });

    y += c3H + 8;
  }

  // ── SEÇÃO: Clínicas — Rentabilidade ──
  y = checkPageBreak(y, 40);
  y = addSectionTitle("Ranking de Clínicas — Rentabilidade", y);

  autoTable(doc, {
    startY: y,
    head: [["#", "Clínica", "Pacientes", "Realizadas", "Repos.", "Faltas/Cancel", "Presença", "Receita", "Perdido"]],
    body: data.clinicStats.slice(0, 5).map((c, i) => [
      i + 1, c.name, c.pacientes, c.realizadas, c.reposicoes,
      c.faltas + c.cancelamentos, `${c.presenca}%`, fmtBRL(c.receita), fmtBRL(c.perdido),
    ]),
    headStyles: { fillColor: VERDE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: CINZA_CLARO },
    columnStyles: { 7: { textColor: VERDE_CLARO }, 8: { textColor: VERMELHO } },
    margin: { left: MARGIN, right: MARGIN },
  });

  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 10) + 8;

  // ── SEÇÃO: Pacientes — Receita ──
  y = checkPageBreak(y, 40);
  y = addSectionTitle("Ranking de Pacientes — Receita (top 10)", y);

  autoTable(doc, {
    startY: y,
    head: [["#", "Paciente", "Clínica", "Tipo", "Realizadas", "Repos.", "Faltas/Cancel", "Presença", "Receita", "Perdido"]],
    body: data.patientStatsByReceita.slice(0, 10).map((p, i) => [
      i + 1, p.name, p.clinicName,
      p.tipo === "convenio" ? "Conv." : "Part.",
      p.realizadas, p.reposicoes, p.faltas + p.cancelamentos,
      `${p.presenca}%`, fmtBRL(p.receita), fmtBRL(p.perdido),
    ]),
    headStyles: { fillColor: VERDE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: CINZA_CLARO },
    columnStyles: { 8: { textColor: VERDE_CLARO }, 9: { textColor: VERMELHO } },
    margin: { left: MARGIN, right: MARGIN },
  });

  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 10) + 8;

  // ── SEÇÃO: Pacientes — Assiduidade ──
  y = checkPageBreak(y, 40);
  y = addSectionTitle("Ranking de Pacientes — Assiduidade (top 10)", y);

  autoTable(doc, {
    startY: y,
    head: [["#", "Paciente", "Clínica", "Diagnóstico", "Realizadas", "Repos.", "Faltas", "Presença", "Status"]],
    body: data.patientStatsByAssid.slice(0, 10).map((p, i) => [
      i + 1, p.name, p.clinicName, p.diagnosis ?? "—",
      p.realizadas, p.reposicoes, p.faltas, `${p.presenca}%`,
      presStatusLabel(p.presenca, p.faltas, p.realizadas, p.reposicoes),
    ]),
    headStyles: { fillColor: VERDE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: CINZA_CLARO },
    didParseCell(hookData) {
      if (hookData.section !== "body" || hookData.column.index !== 8) return;
      const v = String(hookData.cell.raw);
      if (v === "Nunca faltou" || v === "Excelente") hookData.cell.styles.textColor = VERDE_CLARO;
      else if (v === "Otima")   hookData.cell.styles.textColor = AZUL;
      else if (v === "Boa")     hookData.cell.styles.textColor = [245, 158, 11];
      else if (v === "Atencao") hookData.cell.styles.textColor = VERMELHO;
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 10) + 8;

  // ── SEÇÃO: Reposições do período ──
  y = checkPageBreak(y, 30);
  y = addSectionTitle("Reposições do período", y);

  if (data.reposicoes.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(CINZA_MEIO[0], CINZA_MEIO[1], CINZA_MEIO[2]);
    doc.text("Nenhuma reposição realizada no período.", MARGIN, y);
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Paciente", "Data da falta", "Data da reposição", "Status original", "Valor recuperado"]],
      body: data.reposicoes.map((r) => [r.paciente, r.dataFalta, r.dataReposicao, r.statusOriginal, fmtBRL(r.valor)]),
      headStyles: { fillColor: VERDE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: CINZA_CLARO },
      columnStyles: { 4: { textColor: VERDE_CLARO } },
      margin: { left: MARGIN, right: MARGIN },
    });
  }

  // ── Footers em todas as páginas ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`relatorio-financeiro-${data.periodoSlug}.pdf`);
}

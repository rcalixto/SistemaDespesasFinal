import PDFDocument from "pdfkit";
import type {
  PrestacaoAdiantamento,
  PrestacaoAdiantamentoItem,
  ReembolsoItem,
  Adiantamento,
  Reembolso,
  Colaborador,
} from "@shared/schema";

// Helper function to format currency in BRL
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Helper function to format date in pt-BR
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

interface AdiantamentoReportData {
  prestacao: PrestacaoAdiantamento;
  itens: PrestacaoAdiantamentoItem[];
  adiantamento: Adiantamento;
  colaborador: Colaborador;
}

interface ReembolsoReportData {
  reembolso: Reembolso;
  itens: ReembolsoItem[];
  colaborador: Colaborador;
}

export function generateAdiantamentoReport(data: AdiantamentoReportData): PDFDocument {
  const { prestacao, itens, adiantamento, colaborador } = data;
  
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  // Header
  doc.fontSize(20)
    .fillColor("#004650")
    .text("ABERT - Prestação de Contas", { align: "center" })
    .moveDown(0.5);

  doc.fontSize(14)
    .fillColor("#666")
    .text("Adiantamento de Despesas", { align: "center" })
    .moveDown(1.5);

  // Separator line
  doc.strokeColor("#004650")
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke()
    .moveDown(1);

  // Information section
  doc.fontSize(10).fillColor("#000");
  
  const startY = doc.y;
  
  // Left column
  doc.text(`Colaborador: ${colaborador.nome}`, 50, startY);
  doc.text(`Departamento: ${colaborador.departamento || "N/A"}`, 50);
  doc.text(`Centro de Custo: ${colaborador.centroCusto || "N/A"}`, 50);
  doc.text(`Data de Emissão: ${formatDate(new Date())}`, 50);

  // Right column
  doc.text(`Local da Viagem: ${adiantamento.localViagem}`, 320, startY);
  doc.text(`Período: ${formatDate(adiantamento.dataIda)} a ${formatDate(adiantamento.dataVolta)}`, 320);
  doc.text(`Motivo: ${adiantamento.motivo}`, 320);

  doc.moveDown(2);

  // Financial Summary Box
  const boxY = doc.y;
  doc.roundedRect(50, boxY, 495, 80, 5)
    .fillAndStroke("#F5F8FC", "#004650");

  doc.fillColor("#004650")
    .fontSize(12)
    .text("Resumo Financeiro", 60, boxY + 10);

  doc.fontSize(10).fillColor("#000");
  
  const valorAdiantado = Number(prestacao.valorAdiantado) || 0;
  const valorGasto = Number(prestacao.valorGasto) || 0;
  const valorDevolvido = Number(prestacao.valorDevolvido) || 0;
  const valorAFaturar = Number(prestacao.valorAFaturar) || 0;

  doc.text(`Valor Adiantado:`, 60, boxY + 30);
  doc.text(formatCurrency(valorAdiantado), 200, boxY + 30);

  doc.text(`Valor Gasto:`, 60, boxY + 45);
  doc.text(formatCurrency(valorGasto), 200, boxY + 45);

  doc.text(`Valor a Devolver:`, 300, boxY + 30);
  doc.text(formatCurrency(valorDevolvido), 440, boxY + 30);

  doc.text(`Valor a Faturar:`, 300, boxY + 45);
  doc.text(formatCurrency(valorAFaturar), 440, boxY + 45);

  doc.y = boxY + 90;
  doc.moveDown(1);

  // Items table
  doc.fontSize(12)
    .fillColor("#004650")
    .text("Itens de Despesa", 50)
    .moveDown(0.5);

  // Table header
  const tableTop = doc.y;
  doc.fontSize(9)
    .fillColor("#FFF")
    .rect(50, tableTop, 495, 20)
    .fill("#004650");

  doc.text("Categoria", 55, tableTop + 5);
  doc.text("Descrição", 150, tableTop + 5);
  doc.text("Valor", 450, tableTop + 5);

  // Table rows
  let rowY = tableTop + 25;
  doc.fillColor("#000");

  itens.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? "#FFFFFF" : "#F5F8FC";
    doc.rect(50, rowY - 3, 495, 20).fill(bgColor);

    const itemValor = Number(item.valor) || 0;
    doc.fillColor("#000")
      .text(item.categoria, 55, rowY, { width: 90 })
      .text(item.descricao || "Sem descrição", 150, rowY, { width: 290 })
      .text(formatCurrency(itemValor), 450, rowY);

    rowY += 20;

    // Add new page if needed
    if (rowY > 700) {
      doc.addPage();
      rowY = 50;
    }
  });

  doc.moveDown(2);

  // Observations
  const observacoes = prestacao.observacao || "Nenhuma observação registrada";
  doc.fontSize(10)
    .fillColor("#004650")
    .text("Observações:", 50)
    .fillColor("#000")
    .fontSize(9)
    .text(observacoes, 50, doc.y + 5, { width: 495 })
    .moveDown(1);

  // Signatures section
  if (doc.y > 650) {
    doc.addPage();
  }

  const sigY = Math.max(doc.y + 50, 650);
  
  doc.moveDown(2);
  doc.strokeColor("#000")
    .lineWidth(1)
    .moveTo(80, sigY)
    .lineTo(250, sigY)
    .stroke();

  doc.fontSize(9)
    .text("Assinatura do Colaborador", 100, sigY + 10);

  doc.moveTo(330, sigY)
    .lineTo(500, sigY)
    .stroke();

  doc.text("Aprovação Diretoria", 365, sigY + 10);

  doc.moveTo(80, sigY + 50)
    .lineTo(250, sigY + 50)
    .stroke();

  doc.text("Aprovação Financeiro", 110, sigY + 60);

  doc.moveTo(330, sigY + 50)
    .lineTo(500, sigY + 50)
    .stroke();

  doc.text("Data: ___/___/_____", 380, sigY + 60);

  return doc;
}

export function generateReembolsoReport(data: ReembolsoReportData): PDFDocument {
  const { reembolso, itens, colaborador } = data;
  
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  // Header
  doc.fontSize(20)
    .fillColor("#004650")
    .text("ABERT - Prestação de Contas", { align: "center" })
    .moveDown(0.5);

  doc.fontSize(14)
    .fillColor("#666")
    .text("Reembolso de Despesas", { align: "center" })
    .moveDown(1.5);

  // Separator line
  doc.strokeColor("#004650")
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke()
    .moveDown(1);

  // Information section
  doc.fontSize(10).fillColor("#000");
  
  const startY = doc.y;
  
  // Left column
  doc.text(`Colaborador: ${colaborador.nome}`, 50, startY);
  doc.text(`Departamento: ${colaborador.departamento || "N/A"}`, 50);
  doc.text(`Centro de Custo: ${reembolso.centroCusto || "N/A"}`, 50);
  doc.text(`Data de Solicitação: ${formatDate(reembolso.dataSolicitacao || new Date())}`, 50);

  // Right column
  doc.text(`Motivo: ${reembolso.motivo}`, 320, startY);
  doc.text(`Status: ${reembolso.status}`, 320);
  doc.text(`Valor Total: ${formatCurrency(Number(reembolso.valorTotalSolicitado))}`, 320);

  doc.moveDown(2);

  // Financial Summary Box
  const boxY = doc.y;
  doc.roundedRect(50, boxY, 495, 60, 5)
    .fillAndStroke("#F5F8FC", "#004650");

  doc.fillColor("#004650")
    .fontSize(12)
    .text("Resumo Financeiro", 60, boxY + 10);

  doc.fontSize(10).fillColor("#000");
  
  // Calculate total from itens
  const valorTotal = itens.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);

  doc.text(`Valor Total:`, 60, boxY + 35);
  doc.text(formatCurrency(valorTotal), 200, boxY + 35, { width: 150 });

  doc.y = boxY + 70;
  doc.moveDown(1);

  // Items table
  doc.fontSize(12)
    .fillColor("#004650")
    .text("Itens de Despesa", 50)
    .moveDown(0.5);

  // Table header
  const tableTop = doc.y;
  doc.fontSize(9)
    .fillColor("#FFF")
    .rect(50, tableTop, 495, 20)
    .fill("#004650");

  doc.text("Categoria", 55, tableTop + 5);
  doc.text("Descrição", 150, tableTop + 5);
  doc.text("Valor", 450, tableTop + 5);

  // Table rows
  let rowY = tableTop + 25;
  doc.fillColor("#000");

  itens.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? "#FFFFFF" : "#F5F8FC";
    doc.rect(50, rowY - 3, 495, 20).fill(bgColor);

    const itemValor = Number(item.valor) || 0;
    doc.fillColor("#000")
      .text(item.categoria, 55, rowY, { width: 90 })
      .text(item.descricao || "Sem descrição", 150, rowY, { width: 290 })
      .text(formatCurrency(itemValor), 450, rowY);

    rowY += 20;

    // Add new page if needed
    if (rowY > 700) {
      doc.addPage();
      rowY = 50;
    }
  });

  doc.moveDown(2);

  // Justificativa
  doc.fontSize(10)
    .fillColor("#004650")
    .text("Justificativa:", 50)
    .fillColor("#000")
    .fontSize(9)
    .text(reembolso.justificativa, 50, doc.y + 5, { width: 495 })
    .moveDown(1);

  // Observations (optional notes)
  if (reembolso.observacoes) {
    doc.fontSize(10)
      .fillColor("#004650")
      .text("Observações:", 50)
      .fillColor("#000")
      .fontSize(9)
      .text(reembolso.observacoes, 50, doc.y + 5, { width: 495 })
      .moveDown(1);
  }

  // Signatures section
  if (doc.y > 650) {
    doc.addPage();
  }

  const sigY = Math.max(doc.y + 50, 650);
  
  doc.moveDown(2);
  doc.strokeColor("#000")
    .lineWidth(1)
    .moveTo(80, sigY)
    .lineTo(250, sigY)
    .stroke();

  doc.fontSize(9)
    .text("Assinatura do Colaborador", 100, sigY + 10);

  doc.moveTo(330, sigY)
    .lineTo(500, sigY)
    .stroke();

  doc.text("Aprovação Diretoria", 365, sigY + 10);

  doc.moveTo(80, sigY + 50)
    .lineTo(250, sigY + 50)
    .stroke();

  doc.text("Aprovação Financeiro", 110, sigY + 60);

  doc.moveTo(330, sigY + 50)
    .lineTo(500, sigY + 50)
    .stroke();

  doc.text("Data: ___/___/_____", 380, sigY + 60);

  return doc;
}

interface ViagemReportData {
  adiantamento: Adiantamento;
  colaborador: Colaborador;
  prestacao?: PrestacaoAdiantamento;
  prestacaoItens?: PrestacaoAdiantamentoItem[];
  reembolsos?: Reembolso[];
  reembolsoItens?: ReembolsoItem[];
}

export function generateViagemReport(data: ViagemReportData): PDFDocument {
  const { adiantamento, colaborador, prestacao, prestacaoItens = [], reembolsos = [], reembolsoItens = [] } = data;
  
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  doc.fontSize(24)
    .fillColor("#004650")
    .text("ABERT", { align: "center" })
    .moveDown(0.3);

  doc.fontSize(18)
    .fillColor("#004650")
    .text("Relatório de Despesas de Viagem", { align: "center" })
    .moveDown(1.5);

  doc.strokeColor("#004650")
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke()
    .moveDown(1);

  doc.fontSize(11).fillColor("#000");
  
  doc.text(`Nome: ${colaborador.nome}`, 50);
  doc.text(`Destino: ${adiantamento.localViagem}`, 50);
  doc.text(`Período: ${formatDate(adiantamento.dataIda)} a ${formatDate(adiantamento.dataVolta)}`, 50);
  doc.moveDown(1.5);

  const categorias = [
    "Alimentação",
    "Business Center",
    "Combustível",
    "Estacionamento",
    "Fotocópias",
    "Hospedagem",
    "Passagem Internacional",
    "Táxi",
    "Telefone",
    "Outros"
  ];

  const valoresPorCategoria: Record<string, number> = {};
  categorias.forEach(cat => valoresPorCategoria[cat] = 0);

  prestacaoItens.forEach(item => {
    const categoria = item.categoria;
    if (valoresPorCategoria.hasOwnProperty(categoria)) {
      valoresPorCategoria[categoria] += Number(item.valor) || 0;
    } else {
      valoresPorCategoria["Outros"] += Number(item.valor) || 0;
    }
  });

  reembolsoItens.forEach(item => {
    const categoria = item.categoria;
    if (valoresPorCategoria.hasOwnProperty(categoria)) {
      valoresPorCategoria[categoria] += Number(item.valor) || 0;
    } else {
      valoresPorCategoria["Outros"] += Number(item.valor) || 0;
    }
  });

  doc.fontSize(11)
    .fillColor("#004650")
    .text("Discriminação das Despesas", 50)
    .moveDown(0.5);

  const tableTop = doc.y;
  doc.fontSize(9)
    .fillColor("#FFF")
    .rect(50, tableTop, 495, 20)
    .fill("#004650");

  doc.text("Categoria", 55, tableTop + 5);
  doc.text("Valor", 450, tableTop + 5);

  let rowY = tableTop + 25;
  doc.fillColor("#000");
  let totalGeral = 0;

  categorias.forEach((categoria, index) => {
    const valor = valoresPorCategoria[categoria] || 0;
    totalGeral += valor;

    const bgColor = index % 2 === 0 ? "#FFFFFF" : "#F5F8FC";
    doc.rect(50, rowY - 3, 495, 20).fill(bgColor);

    doc.fillColor("#000")
      .text(categoria, 55, rowY)
      .text(formatCurrency(valor), 450, rowY);

    rowY += 20;
  });

  doc.rect(50, rowY - 3, 495, 25).fill("#F5F8FC");
  doc.fontSize(11)
    .fillColor("#004650")
    .text("TOTAL", 55, rowY + 5, { width: 390 })
    .text(formatCurrency(totalGeral), 450, rowY + 5);

  rowY += 35;
  doc.y = rowY;
  doc.moveDown(2);

  const observacoes = adiantamento.observacoes || prestacao?.observacoes || "";
  if (observacoes) {
    doc.fontSize(10)
      .fillColor("#004650")
      .text("Observações:", 50)
      .fillColor("#000")
      .fontSize(9)
      .text(observacoes, 50, doc.y + 5, { width: 495 })
      .moveDown(1);
  }

  if (doc.y > 650) {
    doc.addPage();
  }

  const sigY = Math.max(doc.y + 30, 650);
  
  const hoje = new Date();
  const dataExtenso = `Brasília, ${hoje.getDate()} de ${hoje.toLocaleDateString('pt-BR', { month: 'long' })} de ${hoje.getFullYear()}`;
  
  doc.fontSize(10)
    .fillColor("#000")
    .text(dataExtenso, 50, sigY);

  doc.moveDown(3);
  const lineY = doc.y;
  doc.strokeColor("#000")
    .lineWidth(1)
    .moveTo(200, lineY)
    .lineTo(400, lineY)
    .stroke();

  doc.fontSize(9)
    .text("Assinatura", 270, lineY + 10);

  return doc;
}

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

  // Observations (for reembolso, use justificativa field)
  const observacoes = reembolso.justificativa || "Nenhuma observação registrada";
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
  doc.text(`Centro de Custo: ${colaborador.centroCusto || "N/A"}`, 50);
  doc.text(`Data de Emissão: ${formatDate(new Date())}`, 50);

  // Right column
  doc.text(`Descrição: ${reembolso.descricao}`, 320, startY);
  doc.text(`Data da Despesa: ${formatDate(reembolso.dataDespesa)}`, 320);
  doc.text(`Valor Solicitado: ${formatCurrency(Number(reembolso.valorSolicitado))}`, 320);

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

  // Observations (for reembolso, use justificativa field)
  const observacoes = reembolso.justificativa || "Nenhuma observação registrada";
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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type DadosTitulo = {
  numero: string;
  tipo: string;
  emitenteNome: string;
  emitenteCpfCnpj: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  dataEmissao: string;
  dataVencimento: string;
  prazo: number;
  valor: number;
  taxaCliente: number;
  encargo: number;
  valorLiquidoCliente: number;
  spreadBruto: number;
  spreadLiquido: number;
  impostoProvisao: number;
  clienteNome?: string;
  fornecedorNome?: string;
  criadoEm: string;
};

const R = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export async function gerarContratoPDF(dados: DadosTitulo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const L = 20; // left margin
  const W = 170; // content width
  let y = 20;

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EFFICAZ FACTORING', L, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 200);
  doc.text('CONTRATO DE CESSÃO DE CRÉDITO', L, 20);
  doc.text('contato@grupoefficaz.com.br', 210 - L, 20, { align: 'right' });

  y = 42;

  // ── Título do contrato ──────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE CESSÃO DE CRÉDITO', 105, y, { align: 'center' });

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 120);
  doc.text(
    `Operação nº ${dados.numero}  ·  Gerado em ${dados.criadoEm}`,
    105,
    y,
    { align: 'center' }
  );

  y += 10;

  // ── Linha separadora ────────────────────────────────────
  doc.setDrawColor(220, 220, 235);
  doc.line(L, y, 210 - L, y);
  y += 8;

  // ── Qualificação das partes ─────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DAS PARTES', L, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 70);

  const partes = [
    [
      'CEDENTE (Efficaz Factoring)',
      'Efficaz Factoring Ltda., pessoa jurídica de direito privado,\ninscrita no CNPJ/MF sob o nº 00.000.000/0001-00, com sede\nna Av. Paulista, 1000 — São Paulo/SP, doravante "CESSIONÁRIA".',
    ],
    [
      `CEDENTE / CLIENTE${dados.clienteNome ? ` (${dados.clienteNome})` : ''}`,
      `${dados.emitenteNome}, portador(a) do CPF/CNPJ nº ${dados.emitenteCpfCnpj},\ndoravante denominado(a) "CEDENTE".`,
    ],
  ];

  for (const [titulo, texto] of partes) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(titulo, L, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 70);
    const linhas = doc.splitTextToSize(texto, W);
    doc.text(linhas, L, y);
    y += linhas.length * 5 + 4;
  }

  y += 2;
  doc.line(L, y, 210 - L, y);
  y += 8;

  // ── Objeto ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DO OBJETO', L, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 70);

  const tipoLabel: Record<string, string> = {
    CHEQUE: 'cheque', BOLETO: 'boleto', PROMISSORIA: 'promissória',
  };

  const objetoTexto = `O presente contrato tem por objeto a cessão, pelo CEDENTE à CESSIONÁRIA, do ${tipoLabel[dados.tipo] ?? dados.tipo} de nº ${dados.numero}, emitido por ${dados.emitenteNome} (CPF/CNPJ: ${dados.emitenteCpfCnpj}), com vencimento em ${dados.dataVencimento}, no valor nominal de ${R(dados.valor)}.`;
  const linhasObjeto = doc.splitTextToSize(objetoTexto, W);
  doc.text(linhasObjeto, L, y);
  y += linhasObjeto.length * 5 + 8;

  // ── Tabela financeira ───────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DAS CONDIÇÕES FINANCEIRAS', L, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: L, right: L },
    head: [['Descrição', 'Valor']],
    body: [
      ['Valor nominal do título', R(dados.valor)],
      [`Taxa de cessão (${dados.taxaCliente.toFixed(2)}% a.m. × ${dados.prazo} dias)`, R(dados.encargo)],
      ['Valor líquido a receber pelo Cedente', R(dados.valorLiquidoCliente)],
      ['Prazo até vencimento', `${dados.prazo} dias`],
      ['Data de emissão', dados.dataEmissao],
      ['Data de vencimento', dados.dataVencimento],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Cláusulas ────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DAS CLÁUSULAS GERAIS', L, y);
  y += 6;

  const clausulas = [
    '1. O CEDENTE declara que o crédito cedido é de sua exclusiva titularidade, inexistindo ônus, gravame ou litígio.',
    '2. A cessão ora contratada é definitiva, perfeita e acabada, transferindo-se todos os direitos sobre o título para a CESSIONÁRIA.',
    '3. O CEDENTE responde pela existência, liquidez e certeza do crédito cedido, na forma do art. 295 do Código Civil.',
    '4. O pagamento ao CEDENTE ocorrerá somente após a assinatura digital deste contrato e confirmação do aceite.',
    '5. Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 70);
  for (const c of clausulas) {
    const linhas = doc.splitTextToSize(c, W);
    doc.text(linhas, L, y);
    y += linhas.length * 4.5 + 2;
  }

  y += 8;

  // ── Assinaturas ──────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }

  doc.line(L, y, 210 - L, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 100);
  doc.text('São Paulo, _____ de __________________ de 20____', L, y);
  y += 14;

  const colunaL = L;
  const colunaR = 120;
  doc.line(colunaL, y, colunaL + 70, y);
  doc.line(colunaR, y, colunaR + 70, y);
  y += 4;
  doc.text('Efficaz Factoring (Cessionária)', colunaL, y);
  doc.text(`${dados.emitenteNome}`, colunaR, y);
  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 160);
  doc.text('CNPJ: 00.000.000/0001-00', colunaL, y);
  doc.text(`CPF/CNPJ: ${dados.emitenteCpfCnpj}`, colunaR, y);

  // ── Rodapé ───────────────────────────────────────────────
  const totalPaginas = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 180);
    doc.text(
      `Efficaz Factoring — Contrato de Cessão nº ${dados.numero} — Pág. ${i}/${totalPaginas}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`contrato-${dados.numero}.pdf`);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type DadosTitulo = {
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

const R = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const EMPRESA = {
  razaoSocial: 'EFFICAZ SERVIÇOS FINANCEIROS LTDA',
  fantasia: 'Efficaz Factoring',
  cnpj: '04.578.232/0001-82',
  endereco: 'Rua Leôncio Pires Dourado, nº 840-A, Bairro Bacuri',
  cidade: 'Imperatriz – MA',
  cep: 'CEP 65.901-020',
  email: 'contato@grupoefficaz.com.br',
  telefone: '(99) 8139-2210',
  foro: 'Comarca de Imperatriz, Estado do Maranhão',
};

function addPage(doc: jsPDF, y: number, limite = 265): { doc: jsPDF; y: number; newPage: boolean } {
  if (y > limite) {
    doc.addPage();
    return { doc, y: 22, newPage: true };
  }
  return { doc, y, newPage: false };
}

function secao(doc: jsPDF, titulo: string, y: number, L: number): number {
  const r = addPage(doc, y);
  y = r.y + (r.newPage ? 0 : 4);
  doc.setFillColor(15, 23, 42);
  doc.rect(L - 2, y - 4, 174, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, L, y);
  doc.setTextColor(40, 40, 60);
  return y + 7;
}

function paragrafo(doc: jsPDF, texto: string, y: number, L: number, W: number, size = 8.5): number {
  const r = addPage(doc, y);
  y = r.y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(40, 40, 60);
  const linhas = doc.splitTextToSize(texto, W);
  doc.text(linhas, L, y);
  return y + linhas.length * (size * 0.42) + 3;
}

export async function gerarContratoPDF(dados: DadosTitulo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const L = 18;
  const W = 174;
  let y = 0;

  // ── CABEÇALHO ───────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(EMPRESA.fantasia.toUpperCase(), L, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 175, 210);
  doc.text('CONTRATO DE FOMENTO MERCANTIL E CESSÃO DE CRÉDITO', L, 20);
  doc.text(`CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.email}`, L, 26);

  y = 42;

  // ── TÍTULO ──────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE FOMENTO MERCANTIL', 105, y, { align: 'center' });
  y += 5;
  doc.text('E CESSÃO DE CRÉDITO', 105, y, { align: 'center' });
  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 130);
  doc.text(`Nº ${dados.numero}  ·  Gerado em ${dados.criadoEm}`, 105, y, { align: 'center' });
  y += 5;
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.4);
  doc.line(L, y, 210 - L, y);
  y += 8;

  // ── PREÂMBULO ───────────────────────────────────────────────────
  y = secao(doc, 'IDENTIFICAÇÃO DAS PARTES', y, L);
  y = paragrafo(doc,
    `CESSIONÁRIA: ${EMPRESA.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${EMPRESA.cnpj}, com sede na ${EMPRESA.endereco}, ${EMPRESA.cidade}, ${EMPRESA.cep}, doravante denominada simplesmente "CESSIONÁRIA".`,
    y, L, W);
  y = paragrafo(doc,
    `CEDENTE: ${dados.emitenteNome}, inscrito(a) no CPF/CNPJ sob o nº ${dados.emitenteCpfCnpj}, doravante denominado(a) simplesmente "CEDENTE".`,
    y, L, W);
  y = paragrafo(doc,
    `DEVEDOR / SACADO: ${dados.sacadoNome}, inscrito(a) no CPF/CNPJ sob o nº ${dados.sacadoCpfCnpj}, doravante denominado(a) simplesmente "DEVEDOR".`,
    y, L, W);

  // ── CLÁUSULA 1ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA PRIMEIRA – DO OBJETO E DA NATUREZA JURÍDICA', y, L);
  y = paragrafo(doc,
    '1.1. O presente instrumento tem por objeto a compra e venda mercantil de título de crédito, com a consequente cessão definitiva e irrevogável, pelo CEDENTE à CESSIONÁRIA, do crédito especificado na Cláusula Segunda, nos termos dos arts. 286 a 298 do Código Civil Brasileiro (Lei nº 10.406/2002) e em conformidade com a Resolução CMN nº 2.144/1995, que regulamenta as atividades das sociedades de fomento mercantil.',
    y, L, W);
  y = paragrafo(doc,
    '1.2. A presente operação caracteriza-se como fomento mercantil (factoring), modalidade "convencional", consistindo na aquisição de créditos oriundos de transações mercantis, com pagamento à vista do valor líquido acordado e assunção, pela CESSIONÁRIA, dos riscos de inadimplência do DEVEDOR, ressalvadas as hipóteses de co-obrigação previstas neste contrato.',
    y, L, W);
  y = paragrafo(doc,
    '1.3. A cessão ora contratada é definitiva, perfeita e acabada (pro soluto), transferindo-se todos os direitos, ações e prerrogativas sobre o crédito cedido à CESSIONÁRIA, nos termos do art. 287 do Código Civil.',
    y, L, W);

  // ── CLÁUSULA 2ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA SEGUNDA – DO CRÉDITO CEDIDO E DAS CONDIÇÕES FINANCEIRAS', y, L);
  y = paragrafo(doc,
    `2.1. O crédito objeto desta cessão é representado pelo ${dados.tipo.toLowerCase()} de nº ${dados.numero}, emitido por ${dados.emitenteNome} (CPF/CNPJ: ${dados.emitenteCpfCnpj}), sacado contra ${dados.sacadoNome} (CPF/CNPJ: ${dados.sacadoCpfCnpj}), com data de emissão em ${dados.dataEmissao} e vencimento em ${dados.dataVencimento}, no valor nominal de ${R(dados.valor)}.`,
    y, L, W);

  const r1 = addPage(doc, y + 10);
  y = r1.y;

  autoTable(doc, {
    startY: y,
    margin: { left: L, right: L },
    head: [['Descrição', 'Valor / Prazo']],
    body: [
      ['Valor nominal do título (face value)', R(dados.valor)],
      [`Fator de compra – taxa de cessão (${dados.taxaCliente.toFixed(4)}% a.m. × ${dados.prazo} dias)`, R(dados.encargo)],
      ['Valor líquido a ser pago ao CEDENTE (art. 290 CC)', R(dados.valorLiquidoCliente)],
      ['Prazo total até o vencimento', `${dados.prazo} dias`],
      ['Data de emissão do título', dados.dataEmissao],
      ['Data de vencimento do título', dados.dataVencimento],
    ],
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120 }, 1: { halign: 'right' } },
  });

  y = (doc as any).lastAutoTable.finalY + 6;
  y = paragrafo(doc,
    `2.2. O valor líquido de ${R(dados.valorLiquidoCliente)} será pago ao CEDENTE em até 1 (um) dia útil contado da assinatura deste instrumento e da entrega física ou digital do título, mediante transferência bancária para conta de titularidade do CEDENTE previamente informada.`,
    y, L, W);

  // ── CLÁUSULA 3ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA TERCEIRA – DAS DECLARAÇÕES E GARANTIAS DO CEDENTE', y, L);
  const garantias = [
    '3.1. O CEDENTE declara, sob as penas da lei, que o crédito cedido é de sua exclusiva titularidade, originado de legítima transação comercial já concluída e que o bem ou serviço correspondente foi efetivamente entregue ou prestado ao DEVEDOR.',
    '3.2. O CEDENTE garante que o título cedido não está sujeito a qualquer ônus, gravame, penhora, alienação fiduciária, arresto, sequestro, garantia pignoratícia ou qualquer outra restrição que impeça ou comprometa a cessão ora realizada.',
    '3.3. O CEDENTE declara que não existe contra si qualquer ação judicial, procedimento administrativo ou arbitral que possa afetar a validade ou a exigibilidade do crédito cedido.',
    '3.4. O CEDENTE afirma que o título é legítimo, verdadeiro e que a assinatura nele aposta é autêntica, respondendo civil e criminalmente em caso de falsidade (CP, arts. 171 e 297).',
    '3.5. O CEDENTE garante a existência e a liquidez do crédito cedido, nos termos do art. 295 do Código Civil, respondendo pela evicção em caso de redução, extinção ou ineficácia do crédito por fato anterior à cessão.',
  ];
  for (const g of garantias) { y = paragrafo(doc, g, y, L, W); }

  // ── CLÁUSULA 4ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA QUARTA – DA CO-OBRIGAÇÃO E RESPONSABILIDADE DO CEDENTE', y, L);
  y = paragrafo(doc,
    '4.1. Sem prejuízo do caráter pro soluto desta cessão quanto ao risco de crédito ordinário do DEVEDOR, o CEDENTE assume co-obrigação solidária e irretratável em relação ao crédito cedido nas seguintes hipóteses:',
    y, L, W);
  const coobrig = [
    'a) Comprovada inexistência, nulidade, anulabilidade ou falsidade do título cedido;',
    'b) Recusa de pagamento pelo DEVEDOR fundamentada em vício, defeito ou inexistência da operação que originou o título;',
    'c) Qualquer fato anterior à cessão que torne o crédito inexigível, de valor inferior ao declarado ou juridicamente ineficaz;',
    'd) Descumprimento de qualquer declaração ou garantia prestada na Cláusula Terceira deste instrumento.',
  ];
  for (const c of coobrig) { y = paragrafo(doc, c, y, L + 5, W - 5); }
  y = paragrafo(doc,
    '4.2. Nas hipóteses do item 4.1, o CEDENTE obriga-se a restituir à CESSIONÁRIA o valor integral pago (item 2.2), acrescido de multa de 10% (dez por cento), juros de mora de 1% (um por cento) ao mês e correção monetária pelo IPCA, a contar da data do pagamento, nos termos dos arts. 394 a 396 e 408 do Código Civil.',
    y, L, W);

  // ── CLÁUSULA 5ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA QUINTA – DO INADIMPLEMENTO DO DEVEDOR', y, L);
  y = paragrafo(doc,
    '5.1. Ressalvadas as hipóteses da Cláusula Quarta, o risco do inadimplemento ordinário do DEVEDOR é assumido integralmente pela CESSIONÁRIA, não podendo a CESSIONÁRIA voltar-se contra o CEDENTE pela mera falta de pagamento na data do vencimento.',
    y, L, W);
  y = paragrafo(doc,
    '5.2. Em caso de inadimplemento do DEVEDOR, a CESSIONÁRIA adotará as medidas de cobrança extrajudicial e judicial que entender cabíveis, incluindo o protesto do título (Lei nº 9.492/1997), ação de execução (CPC, arts. 783 e ss.) e demais providências legais, sem necessidade de aviso prévio ao CEDENTE.',
    y, L, W);
  y = paragrafo(doc,
    '5.3. O DEVEDOR será notificado da cessão na forma do art. 290 do Código Civil, tornando-se obrigado a pagar exclusivamente à CESSIONÁRIA a partir da ciência da notificação.',
    y, L, W);

  // ── CLÁUSULA 6ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA SEXTA – DOS ENCARGOS MORATÓRIOS', y, L);
  y = paragrafo(doc,
    '6.1. O inadimplemento de qualquer obrigação pecuniária prevista neste contrato sujeitará a parte devedora ao pagamento de: (i) multa moratória de 2% (dois por cento) sobre o valor devido; (ii) juros de mora de 1% (um por cento) ao mês, pro rata die; e (iii) correção monetária pelo índice IPCA/IBGE, nos termos do art. 395, parágrafo único, do Código Civil.',
    y, L, W);
  y = paragrafo(doc,
    '6.2. Em caso de cobrança judicial ou extrajudicial, os honorários advocatícios serão suportados pela parte inadimplente, fixados em 20% (vinte por cento) sobre o valor total do débito, nos termos do art. 395 do Código Civil e art. 85 do CPC.',
    y, L, W);

  // ── CLÁUSULA 7ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA SÉTIMA – DO VENCIMENTO ANTECIPADO', y, L);
  y = paragrafo(doc,
    '7.1. As obrigações do CEDENTE previstas neste contrato serão consideradas vencidas antecipadamente, independentemente de aviso ou notificação, nas seguintes hipóteses: (i) pedido de recuperação judicial ou extrajudicial, ou decretação de falência do CEDENTE; (ii) protesto de título de valor superior a R$ 5.000,00 (cinco mil reais) em nome do CEDENTE; (iii) comprovação de fraude ou falsidade em qualquer declaração prestada neste instrumento; (iv) dissolução ou liquidação da pessoa jurídica CEDENTE.',
    y, L, W);

  // ── CLÁUSULA 8ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA OITAVA – DA NOTIFICAÇÃO DO DEVEDOR E ENDOSSO', y, L);
  y = paragrafo(doc,
    '8.1. O CEDENTE, neste ato, por força da cessão, concede à CESSIONÁRIA poderes irrevogáveis para notificar o DEVEDOR da cessão, nos termos do art. 290 do Código Civil, e para receber o pagamento do título em seu próprio nome.',
    y, L, W);
  y = paragrafo(doc,
    '8.2. O título de crédito objeto desta cessão será entregue à CESSIONÁRIA acompanhado de endosso em preto ou em branco, conforme o tipo do título, transferindo plena titularidade e direitos cambiários à CESSIONÁRIA nos termos da Lei nº 7.357/1985 (cheque), Decreto 2.044/1908 e Decreto-Lei 167/1967 (cédulas) e legislação aplicável.',
    y, L, W);

  // ── CLÁUSULA 9ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA NONA – DAS DISPOSIÇÕES GERAIS', y, L);
  const gerais = [
    '9.1. Este contrato é celebrado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores a qualquer título.',
    '9.2. A tolerância de qualquer das partes quanto ao descumprimento de obrigação pela outra não implica novação, renúncia ou alteração das condições aqui estabelecidas.',
    '9.3. A eventual nulidade ou ineficácia de qualquer cláusula deste contrato não compromete a validade das demais, que continuarão em pleno vigor (princípio da conservação do negócio jurídico – art. 184 CC).',
    '9.4. As partes elegem a assinatura digital com certificado ICP-Brasil ou assinatura eletrônica com validade legal como forma equivalente à assinatura manuscrita, nos termos da Lei nº 14.063/2020 e MP nº 2.200-2/2001.',
    '9.5. Este contrato é regido pelas leis da República Federativa do Brasil, em especial pelo Código Civil (Lei nº 10.406/2002), pelo Código de Processo Civil (Lei nº 13.105/2015) e pelas normas aplicáveis ao mercado de fomento mercantil.',
  ];
  for (const g of gerais) { y = paragrafo(doc, g, y, L, W); }

  // ── CLÁUSULA 10ª ────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA DÉCIMA – DO FORO DE ELEIÇÃO', y, L);
  y = paragrafo(doc,
    `10.1. As partes elegem, de forma irrevogável, o foro da ${EMPRESA.foro}, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer questões oriundas deste contrato, nos termos do art. 63 do Código de Processo Civil.`,
    y, L, W);

  // ── ASSINATURAS ─────────────────────────────────────────────────
  const r2 = addPage(doc, y + 40);
  y = r2.y + 8;

  doc.setDrawColor(180, 190, 210);
  doc.setLineWidth(0.3);
  doc.line(L, y, 210 - L, y);
  y += 7;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 80);
  doc.text(`Imperatriz – MA, ${dataAtualPorExtenso()}`, L, y);
  y += 14;

  // Assinatura esquerda
  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(EMPRESA.razaoSocial, L, y, { maxWidth: 78 });
  doc.text(dados.emitenteNome, 112, y, { maxWidth: 78 });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 130);
  doc.text(`CNPJ: ${EMPRESA.cnpj}`, L, y);
  doc.text(`CPF/CNPJ: ${dados.emitenteCpfCnpj}`, 112, y);
  y += 4;
  doc.text('CESSIONÁRIA', L, y);
  doc.text('CEDENTE', 112, y);
  y += 12;

  // Testemunhas
  doc.setTextColor(100, 100, 120);
  doc.setFontSize(7.5);
  doc.text('Testemunha 1:', L, y);
  doc.text('Testemunha 2:', 112, y);
  y += 4;
  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 4;
  doc.text('Nome: _________________________________', L, y);
  doc.text('Nome: _________________________________', 112, y);
  y += 4;
  doc.text('CPF: __________________________________', L, y);
  doc.text('CPF: __________________________________', 112, y);

  // ── RODAPÉ ──────────────────────────────────────────────────────
  const totalPags = doc.getNumberOfPages();
  for (let i = 1; i <= totalPags; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 175, 210);
    doc.text(
      `${EMPRESA.razaoSocial}  ·  CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.endereco}, ${EMPRESA.cidade}  ·  ${EMPRESA.email}`,
      105, 289, { align: 'center' });
    doc.text(
      `Contrato nº ${dados.numero}  —  Página ${i} de ${totalPags}`,
      105, 294, { align: 'center' });
  }

  doc.save(`contrato-${dados.numero}.pdf`);
}

// ─── CONTRATO DE OPERAÇÃO (múltiplos títulos) ─────────────────────────────────

export type TituloOperacaoPDF = {
  numero: string;
  tipo: string;
  emitenteNome: string;
  emitenteCpfCnpj: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  dataEmissao: string;    // dd/MM/yyyy
  dataVencimento: string; // dd/MM/yyyy
  prazo: number;
  valor: number;
  taxaCliente: number;
  encargo: number;
  valorLiquidoCliente: number;
};

export type OperacaoPDF = {
  numero: string;
  taxaCliente: number;
  taxaFornecedor: number;
  clienteNome?: string;
  clienteCpfCnpj?: string;
  fornecedorNome?: string;
  criadoEm: string; // dd/MM/yyyy HH:mm
};

const MESES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function dataAtualPorExtenso(): string {
  const hoje = new Date();
  return `${hoje.getDate()} de ${MESES_PT[hoje.getMonth()]} de ${hoje.getFullYear()}`;
}

function parseDateStr(s: string): number {
  const [d, m, y] = s.split('/').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export async function gerarContratoOperacaoPDF(operacao: OperacaoPDF, titulos: TituloOperacaoPDF[]) {
  if (!titulos.length) return;

  // Ordena por vencimento ASC, valor ASC
  const titulosOrdenados = [...titulos].sort((a, b) => {
    const dateDiff = parseDateStr(a.dataVencimento) - parseDateStr(b.dataVencimento);
    if (dateDiff !== 0) return dateDiff;
    return a.valor - b.valor;
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const L = 18;
  const W = 174;
  let y = 0;

  const totalValor = titulosOrdenados.reduce((s, t) => s + t.valor, 0);
  const totalEncargo = titulosOrdenados.reduce((s, t) => s + t.encargo, 0);
  const totalLiquido = titulosOrdenados.reduce((s, t) => s + t.valorLiquidoCliente, 0);

  // Usa o primeiro título como referência para sacado
  const t0 = titulosOrdenados[0];

  // ── CABEÇALHO ───────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(EMPRESA.fantasia.toUpperCase(), L, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 175, 210);
  doc.text('CONTRATO DE FOMENTO MERCANTIL E CESSÃO DE CRÉDITOS', L, 20);
  doc.text(`CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.email}`, L, 26);

  y = 42;

  // ── TÍTULO ──────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE FOMENTO MERCANTIL', 105, y, { align: 'center' });
  y += 5;
  doc.text('E CESSÃO DE CRÉDITOS — OPERAÇÃO', 105, y, { align: 'center' });
  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 130);
  doc.text(`Operação Nº ${operacao.numero}  ·  Gerado em ${operacao.criadoEm}  ·  ${titulos.length} título(s)`, 105, y, { align: 'center' });
  y += 5;
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.4);
  doc.line(L, y, 210 - L, y);
  y += 8;

  // ── IDENTIFICAÇÃO DAS PARTES ─────────────────────────────────────
  y = secao(doc, 'IDENTIFICAÇÃO DAS PARTES', y, L);
  y = paragrafo(doc,
    `CESSIONÁRIA: ${EMPRESA.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${EMPRESA.cnpj}, com sede na ${EMPRESA.endereco}, ${EMPRESA.cidade}, ${EMPRESA.cep}, doravante denominada simplesmente "CESSIONÁRIA".`,
    y, L, W);
  y = paragrafo(doc,
    `CEDENTE: ${operacao.clienteNome ?? t0.emitenteNome}, inscrito(a) no CPF/CNPJ sob o nº ${operacao.clienteCpfCnpj ?? t0.emitenteCpfCnpj}, doravante denominado(a) simplesmente "CEDENTE".`,
    y, L, W);
  if (titulosOrdenados.some(t => t.sacadoNome !== t0.sacadoNome)) {
    y = paragrafo(doc,
      `DEVEDORES / SACADOS: conforme discriminado na tabela de títulos abaixo.`,
      y, L, W);
  } else {
    y = paragrafo(doc,
      `DEVEDOR / SACADO: ${t0.sacadoNome}, inscrito(a) no CPF/CNPJ sob o nº ${t0.sacadoCpfCnpj}, doravante denominado(a) simplesmente "DEVEDOR".`,
      y, L, W);
  }
  if (operacao.clienteNome) {
    y = paragrafo(doc, `CLIENTE CUSTODIANTE: ${operacao.clienteNome}.`, y, L, W);
  }
  if (operacao.fornecedorNome) {
    y = paragrafo(doc, `FORNECEDOR DE CAPITAL: ${operacao.fornecedorNome}.`, y, L, W);
  }

  // ── CLÁUSULA 1ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA PRIMEIRA – DO OBJETO E DA NATUREZA JURÍDICA', y, L);
  y = paragrafo(doc,
    `1.1. O presente instrumento tem por objeto a compra e venda mercantil dos títulos de crédito listados na Cláusula Segunda, com a consequente cessão definitiva e irrevogável, pelo CEDENTE à CESSIONÁRIA, dos créditos ali especificados, nos termos dos arts. 286 a 298 do Código Civil Brasileiro (Lei nº 10.406/2002) e em conformidade com a Resolução CMN nº 2.144/1995, que regulamenta as atividades das sociedades de fomento mercantil.`,
    y, L, W);
  y = paragrafo(doc,
    `1.2. A presente operação caracteriza-se como fomento mercantil (factoring), modalidade "convencional", consistindo na aquisição de créditos oriundos de transações mercantis, com pagamento à vista do valor líquido acordado e assunção, pela CESSIONÁRIA, dos riscos de inadimplência dos DEVEDORES, ressalvadas as hipóteses de co-obrigação previstas neste contrato.`,
    y, L, W);

  // ── CLÁUSULA 2ª — CRÉDITOS CEDIDOS ──────────────────────────────
  y = secao(doc, 'CLÁUSULA SEGUNDA – DOS CRÉDITOS CEDIDOS E DAS CONDIÇÕES FINANCEIRAS', y, L);
  y = paragrafo(doc,
    `2.1. Os créditos objeto desta cessão são representados pelos títulos de crédito abaixo discriminados, totalizando o valor nominal bruto de ${R(totalValor)}, com taxa de cessão (fator de compra) de ${operacao.taxaCliente.toFixed(4)}% ao mês, encargos totais de ${R(totalEncargo)} e valor líquido a ser pago ao CEDENTE de ${R(totalLiquido)}.`,
    y, L, W);

  const r1 = addPage(doc, y + 10);
  y = r1.y;

  autoTable(doc, {
    startY: y,
    margin: { left: L, right: L },
    head: [['Nº Título', 'Tipo', 'Emitente', 'Sacado', 'Vencimento', 'Prazo', 'Valor', 'Encargo', 'Líquido']],
    body: titulosOrdenados.map(t => [
      t.numero,
      t.tipo,
      `${t.emitenteNome}\n${t.emitenteCpfCnpj}`,
      `${t.sacadoNome}\n${t.sacadoCpfCnpj}`,
      t.dataVencimento,
      `${t.prazo}d`,
      R(t.valor),
      R(t.encargo),
      R(t.valorLiquidoCliente),
    ]),
    foot: [['TOTAL', '', '', '', '', '', R(totalValor), R(totalEncargo), R(totalLiquido)]],
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    footStyles: { fillColor: [230, 235, 245], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 16 },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 18 },
      5: { cellWidth: 10, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 18, halign: 'right' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  y = paragrafo(doc,
    `2.2. O valor líquido total de ${R(totalLiquido)} será pago ao CEDENTE em até 1 (um) dia útil contado da assinatura deste instrumento e da entrega física ou digital dos títulos, mediante transferência bancária para conta de titularidade do CEDENTE previamente informada.`,
    y, L, W);

  // ── CLÁUSULA 3ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA TERCEIRA – DAS DECLARAÇÕES E GARANTIAS DO CEDENTE', y, L);
  const garantias = [
    '3.1. O CEDENTE declara, sob as penas da lei, que os créditos cedidos são de sua exclusiva titularidade, originados de legítimas transações comerciais já concluídas e que os bens ou serviços correspondentes foram efetivamente entregues ou prestados aos DEVEDORES.',
    '3.2. O CEDENTE garante que os títulos cedidos não estão sujeitos a qualquer ônus, gravame, penhora, alienação fiduciária, arresto, sequestro, garantia pignoratícia ou qualquer outra restrição que impeça ou comprometa a cessão ora realizada.',
    '3.3. O CEDENTE declara que não existe contra si qualquer ação judicial, procedimento administrativo ou arbitral que possa afetar a validade ou a exigibilidade dos créditos cedidos.',
    '3.4. O CEDENTE afirma que os títulos são legítimos, verdadeiros e que as assinaturas neles apostas são autênticas, respondendo civil e criminalmente em caso de falsidade (CP, arts. 171 e 297).',
    '3.5. O CEDENTE garante a existência e a liquidez dos créditos cedidos, nos termos do art. 295 do Código Civil, respondendo pela evicção em caso de redução, extinção ou ineficácia dos créditos por fato anterior à cessão.',
  ];
  for (const g of garantias) { y = paragrafo(doc, g, y, L, W); }

  // ── CLÁUSULA 4ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA QUARTA – DA CO-OBRIGAÇÃO E RESPONSABILIDADE DO CEDENTE', y, L);
  y = paragrafo(doc,
    '4.1. Sem prejuízo do caráter pro soluto desta cessão quanto ao risco de crédito ordinário dos DEVEDORES, o CEDENTE assume co-obrigação solidária e irretratável em relação aos créditos cedidos nas seguintes hipóteses:',
    y, L, W);
  const coobrig = [
    'a) Comprovada inexistência, nulidade, anulabilidade ou falsidade de qualquer título cedido;',
    'b) Recusa de pagamento pelo DEVEDOR fundamentada em vício, defeito ou inexistência da operação que originou o título;',
    'c) Qualquer fato anterior à cessão que torne o crédito inexigível, de valor inferior ao declarado ou juridicamente ineficaz;',
    'd) Descumprimento de qualquer declaração ou garantia prestada na Cláusula Terceira deste instrumento.',
  ];
  for (const c of coobrig) { y = paragrafo(doc, c, y, L + 5, W - 5); }
  y = paragrafo(doc,
    `4.2. Nas hipóteses do item 4.1, o CEDENTE obriga-se a restituir à CESSIONÁRIA o valor integral pago, acrescido de multa de 10% (dez por cento), juros de mora de 1% (um por cento) ao mês e correção monetária pelo IPCA, a contar da data do pagamento.`,
    y, L, W);

  // ── CLÁUSULA 5ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA QUINTA – DO INADIMPLEMENTO DOS DEVEDORES', y, L);
  y = paragrafo(doc,
    '5.1. Ressalvadas as hipóteses da Cláusula Quarta, o risco do inadimplemento ordinário dos DEVEDORES é assumido integralmente pela CESSIONÁRIA, não podendo a CESSIONÁRIA voltar-se contra o CEDENTE pela mera falta de pagamento na data do vencimento.',
    y, L, W);
  y = paragrafo(doc,
    '5.2. Em caso de inadimplemento de qualquer DEVEDOR, a CESSIONÁRIA adotará as medidas de cobrança extrajudicial e judicial que entender cabíveis, incluindo o protesto do título (Lei nº 9.492/1997) e demais providências legais.',
    y, L, W);

  // ── CLÁUSULA 6ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA SEXTA – DOS ENCARGOS MORATÓRIOS', y, L);
  y = paragrafo(doc,
    '6.1. O inadimplemento de qualquer obrigação pecuniária prevista neste contrato sujeitará a parte devedora ao pagamento de: (i) multa moratória de 2% (dois por cento) sobre o valor devido; (ii) juros de mora de 1% (um por cento) ao mês, pro rata die; e (iii) correção monetária pelo índice IPCA/IBGE.',
    y, L, W);

  // ── CLÁUSULA 7ª ─────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA SÉTIMA – DAS DISPOSIÇÕES GERAIS E DO FORO', y, L);
  const gerais = [
    '7.1. Este contrato é celebrado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores a qualquer título.',
    '7.2. A tolerância de qualquer das partes quanto ao descumprimento de obrigação pela outra não implica novação, renúncia ou alteração das condições aqui estabelecidas.',
    '7.3. A eventual nulidade ou ineficácia de qualquer cláusula deste contrato não compromete a validade das demais, que continuarão em pleno vigor.',
    '7.4. As partes elegem a assinatura digital com certificado ICP-Brasil ou assinatura eletrônica com validade legal como forma equivalente à assinatura manuscrita, nos termos da Lei nº 14.063/2020.',
    `7.5. As partes elegem, de forma irrevogável, o foro da ${EMPRESA.foro}, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer questões oriundas deste contrato.`,
  ];
  for (const g of gerais) { y = paragrafo(doc, g, y, L, W); }

  // ── ASSINATURAS ─────────────────────────────────────────────────
  const r2 = addPage(doc, y + 40);
  y = r2.y + 8;

  doc.setDrawColor(180, 190, 210);
  doc.setLineWidth(0.3);
  doc.line(L, y, 210 - L, y);
  y += 7;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 80);
  doc.text(`Imperatriz – MA, ${dataAtualPorExtenso()}`, L, y);
  y += 14;

  const cedenteName = operacao.clienteNome ?? t0.emitenteNome;
  const cedenteCpfCnpj = operacao.clienteCpfCnpj ?? t0.emitenteCpfCnpj;

  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(EMPRESA.razaoSocial, L, y, { maxWidth: 78 });
  doc.text(cedenteName, 112, y, { maxWidth: 78 });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 130);
  doc.text(`CNPJ: ${EMPRESA.cnpj}`, L, y);
  doc.text(`CPF/CNPJ: ${cedenteCpfCnpj}`, 112, y);
  y += 4;
  doc.text('CESSIONÁRIA', L, y);
  doc.text('CEDENTE', 112, y);
  y += 12;

  doc.setTextColor(100, 100, 120);
  doc.setFontSize(7.5);
  doc.text('Testemunha 1:', L, y);
  doc.text('Testemunha 2:', 112, y);
  y += 4;
  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 4;
  doc.text('Nome: _________________________________', L, y);
  doc.text('Nome: _________________________________', 112, y);
  y += 4;
  doc.text('CPF: __________________________________', L, y);
  doc.text('CPF: __________________________________', 112, y);

  // ── RODAPÉ ──────────────────────────────────────────────────────
  const totalPags = doc.getNumberOfPages();
  for (let i = 1; i <= totalPags; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 175, 210);
    doc.text(
      `${EMPRESA.razaoSocial}  ·  CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.endereco}, ${EMPRESA.cidade}  ·  ${EMPRESA.email}`,
      105, 289, { align: 'center' });
    doc.text(
      `Operação Nº ${operacao.numero}  —  Página ${i} de ${totalPags}`,
      105, 294, { align: 'center' });
  }

  doc.save(`contrato-operacao-${operacao.numero}.pdf`);
}

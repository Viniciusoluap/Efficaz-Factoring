import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarCpfCnpj } from '@/lib/calculos';

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
  clienteEmail?: string;
  clienteTelefone?: string;
  clienteEndereco?: string;
  clienteRepresentanteNome?: string;
  clienteRepresentanteCpf?: string;
  fornecedorNome?: string;
  criadoEm: string;
};

const R = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export type EmpresaConfig = {
  nomeEmpresa?: string;
  cnpj?: string | null;
  emailSistema?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};

const EMPRESA_DEFAULT = {
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

function buildEmpresa(cfg?: EmpresaConfig) {
  const e = { ...EMPRESA_DEFAULT };
  if (cfg?.nomeEmpresa) e.fantasia = cfg.nomeEmpresa;
  if (cfg?.cnpj) e.cnpj = cfg.cnpj;
  if (cfg?.emailSistema) e.email = cfg.emailSistema;
  if (cfg?.telefone) e.telefone = cfg.telefone;
  if (cfg?.endereco) e.endereco = cfg.endereco;
  return e;
}

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

export async function gerarContratoPDF(dados: DadosTitulo, empresaConfig?: EmpresaConfig) {
  const EMPRESA = buildEmpresa(empresaConfig);
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
    `CEDENTE: ${dados.clienteNome ?? dados.emitenteNome}, inscrito(a) no CPF/CNPJ sob o nº ${formatarCpfCnpj(dados.emitenteCpfCnpj)}${buildContato(dados.clienteEndereco, dados.clienteTelefone, dados.clienteEmail)}, doravante denominado(a) simplesmente "CEDENTE".`,
    y, L, W);
  y = paragrafo(doc,
    `DEVEDOR / SACADO: ${dados.sacadoNome}, inscrito(a) no CPF/CNPJ sob o nº ${formatarCpfCnpj(dados.sacadoCpfCnpj)}, doravante denominado(a) simplesmente "DEVEDOR".`,
    y, L, W);
  if (dados.clienteRepresentanteNome && dados.clienteRepresentanteCpf) {
    y = paragrafo(doc,
      `AVALISTA: ${dados.clienteRepresentanteNome}, inscrito(a) no CPF sob o nº ${formatarCpfCnpj(dados.clienteRepresentanteCpf)}, representante legal do CEDENTE, doravante denominado(a) simplesmente "AVALISTA".`,
      y, L, W);
  }

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
    `2.1. O crédito objeto desta cessão é representado pelo ${dados.tipo.toLowerCase()} de nº ${dados.numero}, emitido por ${dados.emitenteNome} (CPF/CNPJ: ${formatarCpfCnpj(dados.emitenteCpfCnpj)}), sacado contra ${dados.sacadoNome} (CPF/CNPJ: ${formatarCpfCnpj(dados.sacadoCpfCnpj)}), com data de emissão em ${dados.dataEmissao} e vencimento em ${dados.dataVencimento}, no valor nominal de ${R(dados.valor)}.`,
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
  if (dados.clienteRepresentanteNome && dados.clienteRepresentanteCpf) {
    y = paragrafo(doc,
      `4.3. O AVALISTA ${dados.clienteRepresentanteNome}, CPF ${formatarCpfCnpj(dados.clienteRepresentanteCpf)}, responsabiliza-se solidariamente e como principal pagador por todas as obrigações do CEDENTE decorrentes deste contrato, renunciando expressamente ao benefício de ordem previsto no art. 827 do Código Civil, respondendo com seus bens presentes e futuros em caso de inadimplemento do CEDENTE.`,
      y, L, W);
  }

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
  if (y > 190) { doc.addPage(); y = 22; }
  y += 10;

  doc.setDrawColor(180, 190, 210);
  doc.setLineWidth(0.3);
  doc.line(L, y, 210 - L, y);
  y += 8;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 80);
  doc.text(`Imperatriz – MA, ${dataAtualPorExtenso()}`, L, y);
  y += 18;

  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(EMPRESA.razaoSocial, L, y, { maxWidth: 78 });
  doc.text(dados.emitenteNome, 112, y, { maxWidth: 78 });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 130);
  doc.text(`CNPJ: ${EMPRESA.cnpj}`, L, y);
  doc.text(`CPF/CNPJ: ${formatarCpfCnpj(dados.emitenteCpfCnpj)}`, 112, y);
  y += 5;
  doc.text('CESSIONÁRIA', L, y);
  doc.text('CEDENTE', 112, y);
  y += 16;

  // Bloco AVALISTA (se aplicável)
  if (dados.clienteRepresentanteNome && dados.clienteRepresentanteCpf) {
    const av = addPage(doc, y + 20);
    y = av.y;
    doc.line(L, y, L + 78, y);
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
    doc.text(dados.clienteRepresentanteNome, L, y, { maxWidth: 78 });
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 130);
    doc.text(`CPF: ${formatarCpfCnpj(dados.clienteRepresentanteCpf)}`, L, y);
    y += 5;
    doc.text('AVALISTA / REPRESENTANTE LEGAL', L, y);
    y += 16;
  }

  // Testemunhas
  const av2 = addPage(doc, y + 20);
  y = av2.y;
  doc.setTextColor(100, 100, 120);
  doc.setFontSize(7.5);
  doc.text('Testemunha 1:', L, y);
  doc.text('Testemunha 2:', 112, y);
  y += 5;
  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 5;
  doc.text('Nome: _________________________________', L, y);
  doc.text('Nome: _________________________________', 112, y);
  y += 5;
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
  clienteEmail?: string;
  clienteTelefone?: string;
  clienteEndereco?: string;
  clienteRepresentanteNome?: string;
  clienteRepresentanteCpf?: string;
  fornecedorNome?: string;
  fornecedorCpfCnpj?: string;
  fornecedorEmail?: string;
  fornecedorTelefone?: string;
  criadoEm: string; // dd/MM/yyyy HH:mm
};

export type TituloFornecedorPDF = {
  numero: string;
  tipo: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  dataVencimento: string;
  prazo: number;
  valor: number;
  custoCedente: number; // encargo do fornecedor (ganho do fornecedor)
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

function buildContato(endereco?: string | null, telefone?: string | null, email?: string | null): string {
  const parts: string[] = [];
  if (endereco) parts.push(`endereço: ${endereco}`);
  if (telefone) parts.push(`telefone: ${telefone}`);
  if (email) parts.push(`e-mail: ${email}`);
  return parts.length ? `, ${parts.join(', ')}` : '';
}

export async function gerarContratoOperacaoPDF(operacao: OperacaoPDF, titulos: TituloOperacaoPDF[], empresaConfig?: EmpresaConfig) {
  if (!titulos.length) return;
  const EMPRESA = buildEmpresa(empresaConfig);

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
    `CEDENTE: ${operacao.clienteNome ?? t0.emitenteNome}, inscrito(a) no CPF/CNPJ sob o nº ${formatarCpfCnpj(operacao.clienteCpfCnpj ?? t0.emitenteCpfCnpj)}${buildContato(operacao.clienteEndereco, operacao.clienteTelefone, operacao.clienteEmail)}, doravante denominado(a) simplesmente "CEDENTE".`,
    y, L, W);
  if (titulosOrdenados.some(t => t.sacadoNome !== t0.sacadoNome)) {
    y = paragrafo(doc,
      `DEVEDORES / SACADOS: conforme discriminado na tabela de títulos abaixo.`,
      y, L, W);
  } else {
    y = paragrafo(doc,
      `DEVEDOR / SACADO: ${t0.sacadoNome}, inscrito(a) no CPF/CNPJ sob o nº ${formatarCpfCnpj(t0.sacadoCpfCnpj)}, doravante denominado(a) simplesmente "DEVEDOR".`,
      y, L, W);
  }
  if (operacao.clienteRepresentanteNome && operacao.clienteRepresentanteCpf) {
    y = paragrafo(doc,
      `AVALISTA: ${operacao.clienteRepresentanteNome}, inscrito(a) no CPF sob o nº ${formatarCpfCnpj(operacao.clienteRepresentanteCpf)}, representante legal do CEDENTE, doravante denominado(a) simplesmente "AVALISTA".`,
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

  const tipoLabel: Record<string, string> = { PROMISSORIA: 'Promissória', BOLETO: 'Boleto', CHEQUE: 'Cheque' };
  const tblFont = titulosOrdenados.length > 10 ? 6.5 : titulosOrdenados.length > 6 ? 7 : 7.5;

  autoTable(doc, {
    startY: y,
    margin: { left: L, right: L },
    // Emitente omitido — o CEDENTE já está identificado no texto do contrato
    head: [['Nº Título', 'Tipo', 'Sacado / Devedor', 'Vencimento', 'Prazo', 'Valor', 'Encargo', 'Líquido']],
    body: titulosOrdenados.map(t => [
      t.numero,
      tipoLabel[t.tipo] ?? t.tipo,
      `${t.sacadoNome}\n${t.sacadoCpfCnpj}`,
      t.dataVencimento,
      `${t.prazo}d`,
      R(t.valor),
      R(t.encargo),
      R(t.valorLiquidoCliente),
    ]),
    foot: [['TOTAL', '', '', '', '', R(totalValor), R(totalEncargo), R(totalLiquido)]],
    styles: { fontSize: tblFont, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: tblFont },
    footStyles: { fillColor: [230, 235, 245], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: tblFont },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 18 },
      2: { cellWidth: 44 },
      3: { cellWidth: 20 },
      4: { cellWidth: 8, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
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
  if (operacao.clienteRepresentanteNome && operacao.clienteRepresentanteCpf) {
    y = paragrafo(doc,
      `4.3. O AVALISTA ${operacao.clienteRepresentanteNome}, CPF ${formatarCpfCnpj(operacao.clienteRepresentanteCpf)}, responsabiliza-se solidariamente e como principal pagador por todas as obrigações do CEDENTE decorrentes deste contrato, renunciando expressamente ao benefício de ordem previsto no art. 827 do Código Civil, respondendo com seus bens presentes e futuros em caso de inadimplemento do CEDENTE.`,
      y, L, W);
  }

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
  // Bloco de assinatura precisa de ~90mm; se não cabe na página atual, nova página
  if (y > 190) { doc.addPage(); y = 22; }
  y += 10;

  doc.setDrawColor(180, 190, 210);
  doc.setLineWidth(0.3);
  doc.line(L, y, 210 - L, y);
  y += 8;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 80);
  doc.text(`Imperatriz – MA, ${dataAtualPorExtenso()}`, L, y);
  y += 18;

  const cedenteName = operacao.clienteNome ?? t0.emitenteNome;
  const cedenteCpfCnpj = formatarCpfCnpj(operacao.clienteCpfCnpj ?? t0.emitenteCpfCnpj);

  // Linhas de assinatura
  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(EMPRESA.razaoSocial, L, y, { maxWidth: 78 });
  doc.text(cedenteName, 112, y, { maxWidth: 78 });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 130);
  doc.text(`CNPJ: ${EMPRESA.cnpj}`, L, y);
  doc.text(`CPF/CNPJ: ${cedenteCpfCnpj}`, 112, y);
  y += 5;
  doc.text('CESSIONÁRIA', L, y);
  doc.text('CEDENTE', 112, y);
  y += 16;

  // Bloco AVALISTA — contrato de operação
  if (operacao.clienteRepresentanteNome && operacao.clienteRepresentanteCpf) {
    const avOp = addPage(doc, y + 20);
    y = avOp.y;
    doc.line(L, y, L + 78, y);
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
    doc.text(operacao.clienteRepresentanteNome, L, y, { maxWidth: 78 });
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 130);
    doc.text(`CPF: ${formatarCpfCnpj(operacao.clienteRepresentanteCpf)}`, L, y);
    y += 5;
    doc.text('AVALISTA / REPRESENTANTE LEGAL', L, y);
    y += 16;
  }

  doc.setTextColor(100, 100, 120);
  doc.setFontSize(7.5);
  doc.text('Testemunha 1:', L, y);
  doc.text('Testemunha 2:', 112, y);
  y += 5;
  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 5;
  doc.text('Nome: _________________________________', L, y);
  doc.text('Nome: _________________________________', 112, y);
  y += 5;
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

// ─── EMISSÃO DE DOCUMENTOS (PROMISSÓRIA / BOLETO / CHEQUE) ───────────────────

// ─── CONTRATO DO FORNECEDOR ──────────────────────────────────────────────────

export async function gerarContratoFornecedorPDF(
  operacao: OperacaoPDF,
  titulos: TituloFornecedorPDF[],
  empresaConfig?: EmpresaConfig,
) {
  if (!titulos.length) return;
  const EMPRESA = buildEmpresa(empresaConfig);

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

  const totalValor     = titulosOrdenados.reduce((s, t) => s + t.valor, 0);
  const totalCusto     = titulosOrdenados.reduce((s, t) => s + t.custoCedente, 0);
  const totalDeposito  = totalValor - totalCusto; // valor que o fornecedor deposita na Efficaz

  // ── CABEÇALHO ─────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(EMPRESA.fantasia.toUpperCase(), L, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 175, 210);
  doc.text('CONTRATO DE CESSÃO DE CRÉDITOS — FORNECEDOR DE CAPITAL', L, 20);
  doc.text(`CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.email}`, L, 26);

  y = 42;

  // ── TÍTULO ────────────────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE CESSÃO DE CRÉDITOS', 105, y, { align: 'center' });
  y += 5;
  doc.text('FORNECEDOR DE CAPITAL', 105, y, { align: 'center' });
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

  // ── IDENTIFICAÇÃO DAS PARTES ───────────────────────────────────────────────
  y = secao(doc, 'IDENTIFICAÇÃO DAS PARTES', y, L);

  // CESSIONÁRIO = Fornecedor
  y = paragrafo(doc,
    `CESSIONÁRIO: ${operacao.fornecedorNome ?? '—'}, inscrito(a) no CPF/CNPJ sob o nº ${formatarCpfCnpj(operacao.fornecedorCpfCnpj ?? '—')}${buildContato(undefined, operacao.fornecedorTelefone, operacao.fornecedorEmail)}, doravante denominado(a) simplesmente "CESSIONÁRIO".`,
    y, L, W);

  // CEDENTE = Cliente custodiante
  y = paragrafo(doc,
    `CEDENTE: ${operacao.clienteNome ?? '—'}, inscrito(a) no CPF/CNPJ sob o nº ${formatarCpfCnpj(operacao.clienteCpfCnpj ?? '—')}${buildContato(operacao.clienteEndereco, operacao.clienteTelefone, operacao.clienteEmail)}, doravante denominado(a) simplesmente "CEDENTE".`,
    y, L, W);

  // INTERMEDIÁRIA = Efficaz
  y = paragrafo(doc,
    `INTERMEDIÁRIA/GESTORA: ${EMPRESA.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${EMPRESA.cnpj}, com sede na ${EMPRESA.endereco}, ${EMPRESA.cidade}, ${EMPRESA.cep}, doravante denominada simplesmente "INTERMEDIÁRIA".`,
    y, L, W);

  y = paragrafo(doc,
    `DEVEDORES / SACADOS: conforme discriminado na tabela de títulos abaixo.`,
    y, L, W);

  // ── CLÁUSULA 1ª ───────────────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA PRIMEIRA – DO OBJETO E DA NATUREZA JURÍDICA', y, L);
  y = paragrafo(doc,
    `1.1. O presente instrumento tem por objeto a cessão definitiva e irrevogável, pelo CEDENTE ao CESSIONÁRIO, dos créditos listados na Cláusula Segunda, com a INTERMEDIÁRIA atuando como gestora e facilitadora da operação de fomento mercantil, nos termos dos arts. 286 a 298 do Código Civil Brasileiro (Lei nº 10.406/2002) e em conformidade com a Resolução CMN nº 2.144/1995.`,
    y, L, W);
  y = paragrafo(doc,
    `1.2. A INTERMEDIÁRIA coordena a operação, recebe o depósito do CESSIONÁRIO e realiza o pagamento ao CEDENTE, não assumindo obrigação financeira própria na relação entre CEDENTE e CESSIONÁRIO.`,
    y, L, W);

  // ── CLÁUSULA 2ª ───────────────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA SEGUNDA – DOS CRÉDITOS CEDIDOS E DAS CONDIÇÕES FINANCEIRAS', y, L);
  y = paragrafo(doc,
    `2.1. Os créditos objeto desta cessão totalizam o valor nominal bruto de ${R(totalValor)}, com taxa de cessão do CESSIONÁRIO de ${operacao.taxaFornecedor.toFixed(4)}% ao mês, gerando encargos de ${R(totalCusto)}. O CESSIONÁRIO deverá depositar na conta da INTERMEDIÁRIA o valor de ${R(totalDeposito)}, conforme discriminado abaixo.`,
    y, L, W);

  const r1 = addPage(doc, y + 10);
  y = r1.y;

  autoTable(doc, {
    startY: y,
    margin: { left: L, right: L },
    head: [['Nº Título', 'Tipo', 'Sacado', 'Vencimento', 'Prazo', 'Valor Nominal', 'Encargo (Fornecedor)', 'A Depositar']],
    body: titulosOrdenados.map(t => [
      t.numero,
      t.tipo === 'PROMISSORIA' ? 'Promissória' : t.tipo === 'BOLETO' ? 'Boleto' : 'Cheque',
      `${t.sacadoNome}\n${t.sacadoCpfCnpj}`,
      t.dataVencimento,
      `${t.prazo}d`,
      R(t.valor),
      R(t.custoCedente),
      R(t.valor - t.custoCedente),
    ]),
    foot: [['TOTAL', '', '', '', '', R(totalValor), R(totalCusto), R(totalDeposito)]],
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    footStyles: { fillColor: [230, 235, 245], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 22 },
      2: { cellWidth: 38 },
      3: { cellWidth: 20 },
      4: { cellWidth: 8, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  y = paragrafo(doc,
    `2.2. O CESSIONÁRIO deverá depositar na conta da INTERMEDIÁRIA o valor total de ${R(totalDeposito)}, em até 1 (um) dia útil após a assinatura deste instrumento e confirmação do recebimento dos títulos originais ou suas cópias autenticadas.`,
    y, L, W);

  // ── CLÁUSULA 3ª ───────────────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES DO CESSIONÁRIO', y, L);
  const obrigacoes = [
    `3.1. O CESSIONÁRIO obriga-se a depositar na conta indicada pela INTERMEDIÁRIA o valor de ${R(totalDeposito)} (${valorPorExtenso(totalDeposito)}), no prazo estabelecido na Cláusula Segunda.`,
    '3.2. O CESSIONÁRIO se responsabiliza pela cobrança dos créditos cedidos diretamente dos DEVEDORES/SACADOS, incumbindo-lhe adotar todas as medidas extrajudiciais e judiciais necessárias para a recuperação dos valores.',
    '3.3. O CESSIONÁRIO declara ter pleno conhecimento dos títulos cedidos e dos riscos inerentes à cobrança, isentando a INTERMEDIÁRIA de qualquer responsabilidade quanto à inadimplência dos DEVEDORES.',
  ];
  for (const o of obrigacoes) { y = paragrafo(doc, o, y, L, W); }

  // ── CLÁUSULA 4ª ───────────────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA QUARTA – DAS GARANTIAS E DECLARAÇÕES DO CEDENTE', y, L);
  const garantias = [
    '4.1. O CEDENTE declara que os créditos cedidos são de sua exclusiva titularidade, originados de legítimas transações mercantis já concluídas.',
    '4.2. O CEDENTE garante que os títulos cedidos não estão sujeitos a qualquer ônus, gravame ou restrição que impeça a presente cessão.',
    '4.3. O CEDENTE assume co-obrigação solidária em caso de nulidade, falsidade ou inexigibilidade dos títulos cedidos, nos termos do art. 295 do Código Civil.',
  ];
  for (const g of garantias) { y = paragrafo(doc, g, y, L, W); }

  // ── CLÁUSULA 5ª ───────────────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA QUINTA – DO PAPEL DA INTERMEDIÁRIA', y, L);
  y = paragrafo(doc,
    '5.1. A INTERMEDIÁRIA atua exclusivamente como gestora e facilitadora desta operação, não sendo parte direta na relação creditícia entre CEDENTE e CESSIONÁRIO. A INTERMEDIÁRIA não responde pelo inadimplemento dos DEVEDORES nem pelas obrigações assumidas pelas demais partes.',
    y, L, W);
  y = paragrafo(doc,
    '5.2. A remuneração da INTERMEDIÁRIA pelos serviços de gestão é de responsabilidade exclusiva do CEDENTE, conforme ajuste em separado, não sendo objeto deste instrumento.',
    y, L, W);

  // ── CLÁUSULA 6ª ───────────────────────────────────────────────────────────
  y = secao(doc, 'CLÁUSULA SEXTA – DISPOSIÇÕES GERAIS E FORO', y, L);
  const gerais = [
    '6.1. Este contrato é celebrado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores.',
    '6.2. A eventual nulidade de qualquer cláusula não compromete a validade das demais.',
    '6.3. As partes elegem a assinatura digital ou eletrônica como equivalente à assinatura manuscrita, nos termos da Lei nº 14.063/2020.',
    `6.4. As partes elegem o foro da ${EMPRESA.foro} para dirimir quaisquer questões oriundas deste contrato.`,
  ];
  for (const g of gerais) { y = paragrafo(doc, g, y, L, W); }

  // ── ASSINATURAS ───────────────────────────────────────────────────────────
  if (y > 190) { doc.addPage(); y = 22; }
  y += 10;

  doc.setDrawColor(180, 190, 210);
  doc.setLineWidth(0.3);
  doc.line(L, y, 210 - L, y);
  y += 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 80);
  doc.text(`Imperatriz – MA, ${dataAtualPorExtenso()}`, L, y);
  y += 18;

  // Três assinaturas: Cessionário | Cedente | Intermediária
  const colW = 55;
  const cols = [L, L + colW + 5, L + (colW + 5) * 2];

  for (const cx of cols) { doc.line(cx, y, cx + colW, y); }
  y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(15, 23, 42);
  doc.text(operacao.fornecedorNome ?? 'CESSIONÁRIO', cols[0] + colW / 2, y, { align: 'center', maxWidth: colW });
  doc.text(operacao.clienteNome ?? 'CEDENTE', cols[1] + colW / 2, y, { align: 'center', maxWidth: colW });
  doc.text(EMPRESA.razaoSocial, cols[2] + colW / 2, y, { align: 'center', maxWidth: colW });
  y += 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 110, 130);
  doc.text(`CPF/CNPJ: ${formatarCpfCnpj(operacao.fornecedorCpfCnpj ?? '—')}`, cols[0] + colW / 2, y, { align: 'center' });
  doc.text(`CPF/CNPJ: ${formatarCpfCnpj(operacao.clienteCpfCnpj ?? '—')}`, cols[1] + colW / 2, y, { align: 'center' });
  doc.text(`CNPJ: ${EMPRESA.cnpj}`, cols[2] + colW / 2, y, { align: 'center' });
  y += 5;
  doc.text('CESSIONÁRIO', cols[0] + colW / 2, y, { align: 'center' });
  doc.text('CEDENTE', cols[1] + colW / 2, y, { align: 'center' });
  doc.text('INTERMEDIÁRIA', cols[2] + colW / 2, y, { align: 'center' });

  // ── RODAPÉ ────────────────────────────────────────────────────────────────
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
      `Operação Nº ${operacao.numero} — Contrato Fornecedor  —  Página ${i} de ${totalPags}`,
      105, 294, { align: 'center' });
  }

  doc.save(`contrato-fornecedor-${operacao.numero}.pdf`);
}

export type TituloDocumentoItem = {
  id: string;
  numero: string;
  tipo: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  emitenteNome: string;
  emitenteCpfCnpj: string;
  dataVencimento: string; // dd/MM/yyyy
  dataEmissao: string;    // dd/MM/yyyy
  prazo: number;
  valor: number;
  encargo: number;
  valorLiquidoCliente: number;
};

function valorPorExtenso(valor: number): string {
  const un = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dez = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const cen = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const toW = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    if (n < 20) return un[n];
    if (n < 100) return dez[Math.floor(n / 10)] + (n % 10 ? ' e ' + un[n % 10] : '');
    if (n < 1000) return cen[Math.floor(n / 100)] + (n % 100 ? ' e ' + toW(n % 100) : '');
    if (n < 1000000) {
      const m = Math.floor(n / 1000), r = n % 1000;
      return (m === 1 ? 'mil' : toW(m) + ' mil') + (r ? (r < 100 ? ' e ' : ', ') + toW(r) : '');
    }
    const m = Math.floor(n / 1000000), r = n % 1000000;
    return (m === 1 ? 'um milhão' : toW(m) + ' milhões') + (r ? ', ' + toW(r) : '');
  };
  const reais = Math.floor(valor);
  const cts = Math.round((valor - reais) * 100);
  let s = '';
  if (reais > 0) s += toW(reais) + (reais === 1 ? ' real' : ' reais');
  if (cts > 0) s += (reais > 0 ? ' e ' : '') + toW(cts) + (cts === 1 ? ' centavo' : ' centavos');
  if (!s) return 'Zero reais';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function addRodapeDocumento(doc: jsPDF, total: number) {
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 175, 210);
    doc.text(`${EMPRESA.razaoSocial}  ·  CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.email}  ·  ${EMPRESA.telefone}`,
      105, 289, { align: 'center' });
    doc.text(`Página ${i} de ${total}`, 105, 294, { align: 'center' });
  }
}

function gerarPaginaPromissoria(doc: jsPDF, t: TituloDocumentoItem, clienteNome?: string, clienteCpfCnpj?: string) {
  const L = 15, W = 180;
  let y = 18;

  // Borda
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.rect(L - 2, 14, W + 4, 262, 'S');

  // Cabeçalho superior
  doc.setFillColor(15, 23, 42);
  doc.rect(L - 2, 14, W + 4, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTA PROMISSÓRIA', 105, y + 4, { align: 'center' });

  y = 34;

  // Linha: Nº e Valor
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nº ${t.numero}`, L, y);
  doc.text(`R$ ${R(t.valor)}`, 210 - L, y, { align: 'right' });

  y += 6;
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 190, 210);
  doc.line(L, y, 210 - L, y);
  y += 7;

  // Valor por extenso
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 60);
  const extensoText = `Valor por extenso: ${valorPorExtenso(t.valor)}`;
  const linhasExtenso = doc.splitTextToSize(extensoText, W);
  doc.text(linhasExtenso, L, y);
  y += linhasExtenso.length * 4 + 4;

  // Texto da promissória
  doc.line(L, y - 2, 210 - L, y - 2);
  y += 3;
  const textoProm = `Aos ${t.dataVencimento}, pagarei por esta NOTA PROMISSÓRIA a ${EMPRESA.razaoSocial}, inscrita no CNPJ/MF sob o nº ${EMPRESA.cnpj}, com sede em ${EMPRESA.endereco}, ${EMPRESA.cidade}, ou à sua ordem, a quantia de ${R(t.valor)} (${valorPorExtenso(t.valor)}), pagável na praça de Imperatriz – MA.`;
  const linhasProm = doc.splitTextToSize(textoProm, W);
  doc.text(linhasProm, L, y);
  y += linhasProm.length * 4 + 8;

  // Quadro informativo
  doc.setFillColor(245, 248, 255);
  doc.rect(L, y, W, 36, 'F');
  doc.setDrawColor(210, 220, 235);
  doc.rect(L, y, W, 36, 'S');
  y += 5;

  const col1 = L + 3, col2 = L + 65, col3 = L + 120;
  const labelStyle = () => { doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(100, 110, 130); };
  const valueStyle = () => { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(15, 23, 42); };

  labelStyle(); doc.text('EMITENTE', col1, y); doc.text('SACADO / DEVEDOR', col2, y); doc.text('VENCIMENTO', col3, y);
  y += 4;
  valueStyle();
  const emiNome = doc.splitTextToSize(t.emitenteNome, 58);
  doc.text(emiNome, col1, y);
  const sacNome = doc.splitTextToSize(t.sacadoNome, 58);
  doc.text(sacNome, col2, y);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
  doc.text(t.dataVencimento, col3, y);
  y += Math.max(emiNome.length, sacNome.length) * 3.8 + 2;

  labelStyle(); doc.text('CPF/CNPJ', col1, y); doc.text('CPF/CNPJ', col2, y); doc.text('PRAZO', col3, y);
  y += 4;
  valueStyle();
  doc.text(formatarCpfCnpj(t.emitenteCpfCnpj), col1, y);
  doc.text(formatarCpfCnpj(t.sacadoCpfCnpj), col2, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.text(`${t.prazo} dias`, col3, y);
  y += 8;

  // Emissão e assinatura
  doc.setTextColor(40, 40, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Imperatriz – MA, ${t.dataEmissao}`, L, y);
  y += 30;

  const sigNome = clienteNome ?? t.emitenteNome;
  const sigCpfCnpj = clienteCpfCnpj ?? t.emitenteCpfCnpj;

  doc.setLineWidth(0.3);
  doc.setDrawColor(100, 110, 130);
  doc.line(105, y, 205 - L, y);
  y += 4;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(sigNome, 105 + (100 - L) / 2, y, { align: 'center', maxWidth: 90 });
  y += 4;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 110, 130);
  doc.text(`CPF/CNPJ: ${formatarCpfCnpj(sigCpfCnpj)}`, 105 + (100 - L) / 2, y, { align: 'center' });
  y += 3;
  doc.text('EMITENTE', 105 + (100 - L) / 2, y, { align: 'center' });

  // Marca d'água / aviso
  y += 12;
  doc.setFontSize(7); doc.setTextColor(150, 160, 180);
  doc.text('Documento emitido por sistema eletrônico — Efficaz Factoring', 105, y, { align: 'center' });
}

function gerarPaginaBoleto(doc: jsPDF, t: TituloDocumentoItem, clienteNome?: string, clienteCpfCnpj?: string) {
  const L = 15, W = 180;
  let y = 18;

  // Cabeçalho
  doc.setFillColor(15, 23, 42);
  doc.rect(L - 2, 14, W + 4, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DUPLICATA / BOLETO DE COBRANÇA', 105, y + 4, { align: 'center' });

  y = 34;

  // Beneficiário
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('BENEFICIÁRIO', L, y);
  y += 4;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text(EMPRESA.razaoSocial, L, y);
  y += 4;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 100);
  doc.text(`CNPJ: ${EMPRESA.cnpj}  ·  ${EMPRESA.endereco}, ${EMPRESA.cidade}  ·  ${EMPRESA.email}`, L, y);
  y += 6;

  doc.setLineWidth(0.4); doc.setDrawColor(180, 190, 210);
  doc.line(L, y, 210 - L, y);
  y += 5;

  // Grid de info principal
  doc.setFillColor(245, 248, 255);
  doc.rect(L, y, W, 28, 'F');
  doc.setDrawColor(210, 220, 235); doc.rect(L, y, W, 28, 'S');

  const col = [L + 3, L + 55, L + 110, L + 145];
  const row1 = y + 5;

  const lbl = (txt: string, x: number, yy: number) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(100, 110, 130); doc.text(txt, x, yy); };
  const val = (txt: string, x: number, yy: number, w = 50) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(15, 23, 42); doc.text(doc.splitTextToSize(txt, w), x, yy); };

  lbl('Nº DOCUMENTO', col[0], row1);   val(t.numero, col[0], row1 + 4);
  lbl('TIPO', col[1], row1);           val(t.tipo === 'BOLETO' ? 'Duplicata Mercantil' : t.tipo, col[1], row1 + 4, 52);
  lbl('VENCIMENTO', col[2], row1);     doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.text(t.dataVencimento, col[2], row1 + 4);
  lbl('VALOR (R$)', col[3], row1);     doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.text(R(t.valor), col[3], row1 + 4);

  const row2 = row1 + 14;
  lbl('EMISSÃO', col[0], row2);  val(t.dataEmissao, col[0], row2 + 4);
  lbl('PRAZO', col[1], row2);    val(`${t.prazo} dias`, col[1], row2 + 4);

  y += 33;

  // Pagador
  doc.setLineWidth(0.3); doc.line(L, y, 210 - L, y); y += 5;
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 110, 130);
  doc.text('SACADO / PAGADOR', L, y); y += 4;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  const sacNome = doc.splitTextToSize(t.sacadoNome, 130);
  doc.text(sacNome, L, y); y += sacNome.length * 4;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 100);
  doc.text(`CPF/CNPJ: ${formatarCpfCnpj(t.sacadoCpfCnpj)}`, L, y); y += 8;

  // Sacador
  const sacadorNome = clienteNome ?? t.emitenteNome;
  const sacadorCpfCnpj = clienteCpfCnpj ?? t.emitenteCpfCnpj;
  doc.line(L, y, 210 - L, y); y += 5;
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 110, 130);
  doc.text('SACADOR / CEDENTE', L, y); y += 4;
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  const emiNome = doc.splitTextToSize(sacadorNome, 130);
  doc.text(emiNome, L, y); y += emiNome.length * 4;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 100);
  doc.text(`CPF/CNPJ: ${formatarCpfCnpj(sacadorCpfCnpj)}`, L, y); y += 10;

  // Instruções
  doc.line(L, y, 210 - L, y); y += 5;
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 110, 130);
  doc.text('INSTRUÇÕES DE COBRANÇA', L, y); y += 4;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(60, 70, 80);
  doc.text('Após o vencimento, sujeito a multa de 2% e juros de 1% ao mês.', L, y); y += 4;
  doc.text('Não receber após 30 dias do vencimento.', L, y); y += 10;

  // Área de código de barras (placeholder)
  doc.setFillColor(240, 243, 250);
  doc.rect(L, y, W, 18, 'F');
  doc.setDrawColor(200, 210, 230); doc.rect(L, y, W, 18, 'S');
  doc.setFontSize(7); doc.setTextColor(150, 160, 175); doc.setFont('helvetica', 'normal');
  doc.text('[ Código de barras — gerado pela instituição bancária ]', 105, y + 10, { align: 'center' });
}

function gerarPaginaCheque(doc: jsPDF, t: TituloDocumentoItem) {
  const L = 15, W = 180;
  let y = 18;

  doc.setFillColor(15, 23, 42);
  doc.rect(L - 2, 14, W + 4, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE CHEQUE', 105, y + 4, { align: 'center' });

  y = 34;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');

  const info = [
    ['Cheque Nº', t.numero],
    ['Emitente', `${t.emitenteNome}  |  CPF/CNPJ: ${t.emitenteCpfCnpj}`],
    ['Sacado / Pagador', `${t.sacadoNome}  |  CPF/CNPJ: ${t.sacadoCpfCnpj}`],
    ['Vencimento', t.dataVencimento],
    ['Emissão', t.dataEmissao],
    ['Prazo', `${t.prazo} dias`],
    ['Valor', R(t.valor)],
    ['Valor por Extenso', valorPorExtenso(t.valor)],
    ['Beneficiário', `${EMPRESA.razaoSocial}  |  CNPJ: ${EMPRESA.cnpj}`],
  ];

  for (const [label, value] of info) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(100, 110, 130);
    doc.text(label + ':', L, y); y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(15, 23, 42);
    const linhas = doc.splitTextToSize(value, W);
    doc.text(linhas, L, y); y += linhas.length * 4 + 4;
  }
}

export type DadosProrrogacao = {
  tituloNumero: string;
  tituloTipo: string;
  emitenteNome: string;
  emitenteCpfCnpj: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  dataVencAnterior: string;
  dataVencNova: string;
  taxaCliente: number;
  encargoProrrogacao: number;
  clienteNome?: string;
  clienteRepresentanteNome?: string;
  clienteRepresentanteCpf?: string;
};

export async function gerarContratoProrrogacaoPDF(dados: DadosProrrogacao, empresaConfig?: EmpresaConfig) {
  const EMPRESA = buildEmpresa(empresaConfig);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const L = 18;
  const W = 174;
  let y = 0;

  // Cabeçalho
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(EMPRESA.fantasia.toUpperCase(), L, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 175, 210);
  doc.text('INSTRUMENTO PARTICULAR DE PRORROGAÇÃO DE PRAZO', L, 20);
  doc.text(`CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.email}`, L, 26);

  y = 42;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUMENTO PARTICULAR DE', 105, y, { align: 'center' });
  y += 5;
  doc.text('PRORROGAÇÃO DE PRAZO DE TÍTULO', 105, y, { align: 'center' });
  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 130);
  doc.text(`Título nº ${dados.tituloNumero}  ·  Gerado em ${dataAtualPorExtenso()}`, 105, y, { align: 'center' });
  y += 5;
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.4);
  doc.line(L, y, 210 - L, y);
  y += 8;

  y = secao(doc, 'IDENTIFICAÇÃO DAS PARTES', y, L);
  y = paragrafo(doc,
    `CESSIONÁRIA: ${EMPRESA.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${EMPRESA.cnpj}, com sede na ${EMPRESA.endereco}, ${EMPRESA.cidade}, ${EMPRESA.cep}, doravante denominada simplesmente "CESSIONÁRIA".`,
    y, L, W);
  y = paragrafo(doc,
    `CEDENTE: ${dados.clienteNome ?? dados.emitenteNome}, inscrito(a) no CPF/CNPJ sob o nº ${formatarCpfCnpj(dados.emitenteCpfCnpj)}, doravante denominado(a) simplesmente "CEDENTE".`,
    y, L, W);
  if (dados.clienteRepresentanteNome && dados.clienteRepresentanteCpf) {
    y = paragrafo(doc,
      `AVALISTA: ${dados.clienteRepresentanteNome}, inscrito(a) no CPF sob o nº ${formatarCpfCnpj(dados.clienteRepresentanteCpf)}, representante legal do CEDENTE, doravante denominado(a) simplesmente "AVALISTA".`,
      y, L, W);
  }

  y = secao(doc, 'CLÁUSULA PRIMEIRA – DO OBJETO DA PRORROGAÇÃO', y, L);
  y = paragrafo(doc,
    `1.1. Pelo presente instrumento, as partes acordam a prorrogação do prazo de vencimento do ${dados.tituloTipo.toLowerCase()} de nº ${dados.tituloNumero}, emitido por ${dados.emitenteNome} (CPF/CNPJ: ${formatarCpfCnpj(dados.emitenteCpfCnpj)}), sacado contra ${dados.sacadoNome} (CPF/CNPJ: ${formatarCpfCnpj(dados.sacadoCpfCnpj)}).`,
    y, L, W);

  y = secao(doc, 'CLÁUSULA SEGUNDA – DAS CONDIÇÕES DA PRORROGAÇÃO', y, L);

  autoTable(doc, {
    startY: y,
    margin: { left: L, right: L },
    head: [['Descrição', 'Valor']],
    body: [
      ['Vencimento original', dados.dataVencAnterior],
      ['Novo vencimento', dados.dataVencNova],
      [`Taxa de prorrogação (% a.m.)`, `${dados.taxaCliente.toFixed(4)}%`],
      ['Encargo de prorrogação', `R$ ${dados.encargoProrrogacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ],
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120 }, 1: { halign: 'right' } },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  y = paragrafo(doc,
    `2.1. O prazo de vencimento do título supracitado fica prorrogado para ${dados.dataVencNova}, mediante o pagamento do encargo de prorrogação no valor de R$ ${dados.encargoProrrogacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, calculado à taxa de ${dados.taxaCliente.toFixed(4)}% ao mês sobre o valor nominal do título, pelo período compreendido entre o vencimento original e a nova data de vencimento.`,
    y, L, W);
  y = paragrafo(doc,
    '2.2. O encargo de prorrogação deverá ser pago pelo CEDENTE à CESSIONÁRIA na data de assinatura deste instrumento, ou conforme acordado entre as partes.',
    y, L, W);

  y = secao(doc, 'CLÁUSULA TERCEIRA – MANUTENÇÃO DAS DEMAIS CLÁUSULAS', y, L);
  y = paragrafo(doc,
    '3.1. Exceto pela alteração da data de vencimento e pelo encargo de prorrogação ora estabelecidos, todas as demais cláusulas e condições do contrato de fomento mercantil original permanecem inalteradas, incluindo as garantias, as declarações do CEDENTE e o foro de eleição.',
    y, L, W);
  if (dados.clienteRepresentanteNome && dados.clienteRepresentanteCpf) {
    y = paragrafo(doc,
      `3.2. O AVALISTA ${dados.clienteRepresentanteNome}, CPF ${formatarCpfCnpj(dados.clienteRepresentanteCpf)}, ratifica neste ato o aval prestado no instrumento original, estendendo sua garantia solidária à nova data de vencimento aqui pactuada.`,
      y, L, W);
  }

  y = secao(doc, 'CLÁUSULA QUARTA – DO FORO', y, L);
  y = paragrafo(doc,
    `4.1. As partes elegem, de forma irrevogável, o foro da ${EMPRESA.foro} para dirimir quaisquer questões oriundas deste instrumento.`,
    y, L, W);

  // Assinaturas
  if (y > 200) { doc.addPage(); y = 22; }
  y += 10;
  doc.setDrawColor(180, 190, 210);
  doc.setLineWidth(0.3);
  doc.line(L, y, 210 - L, y);
  y += 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 80);
  doc.text(`Imperatriz – MA, ${dataAtualPorExtenso()}`, L, y);
  y += 18;

  doc.line(L, y, L + 78, y);
  doc.line(112, y, 112 + 78, y);
  y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
  doc.text(EMPRESA.razaoSocial, L, y, { maxWidth: 78 });
  doc.text(dados.clienteNome ?? dados.emitenteNome, 112, y, { maxWidth: 78 });
  y += 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 130);
  doc.text(`CNPJ: ${EMPRESA.cnpj}`, L, y);
  doc.text(`CPF/CNPJ: ${formatarCpfCnpj(dados.emitenteCpfCnpj)}`, 112, y);
  y += 5;
  doc.text('CESSIONÁRIA', L, y);
  doc.text('CEDENTE', 112, y);
  y += 16;

  if (dados.clienteRepresentanteNome && dados.clienteRepresentanteCpf) {
    const avProrr = addPage(doc, y + 20);
    y = avProrr.y;
    doc.line(L, y, L + 78, y);
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
    doc.text(dados.clienteRepresentanteNome, L, y, { maxWidth: 78 });
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 130);
    doc.text(`CPF: ${formatarCpfCnpj(dados.clienteRepresentanteCpf)}`, L, y);
    y += 5;
    doc.text('AVALISTA / REPRESENTANTE LEGAL', L, y);
    y += 16;
  }

  doc.setTextColor(100, 100, 120); doc.setFontSize(7.5);
  doc.text('Testemunha 1:', L, y); doc.text('Testemunha 2:', 112, y);
  y += 5;
  doc.line(L, y, L + 78, y); doc.line(112, y, 112 + 78, y);
  y += 5;
  doc.text('Nome: _________________________________', L, y); doc.text('Nome: _________________________________', 112, y);
  y += 5;
  doc.text('CPF: __________________________________', L, y); doc.text('CPF: __________________________________', 112, y);

  const totalPags = doc.getNumberOfPages();
  for (let i = 1; i <= totalPags; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 175, 210);
    doc.text(`${EMPRESA.razaoSocial}  ·  CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.email}`, 105, 289, { align: 'center' });
    doc.text(`Prorrogação — Título nº ${dados.tituloNumero}  —  Página ${i} de ${totalPags}`, 105, 294, { align: 'center' });
  }

  doc.save(`prorrogacao-${dados.tituloNumero}.pdf`);
}

export async function gerarDocumentosTitulosPDF(
  titulos: TituloDocumentoItem[],
  operacaoNumero: string,
  clienteNome?: string,
  clienteCpfCnpj?: string,
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  titulos.forEach((t, idx) => {
    if (idx > 0) doc.addPage();
    if (t.tipo === 'PROMISSORIA') {
      gerarPaginaPromissoria(doc, t, clienteNome, clienteCpfCnpj);
    } else if (t.tipo === 'BOLETO') {
      gerarPaginaBoleto(doc, t, clienteNome, clienteCpfCnpj);
    } else {
      gerarPaginaCheque(doc, t);
    }
  });

  addRodapeDocumento(doc, titulos.length);
  return doc;
}

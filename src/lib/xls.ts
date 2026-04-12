import * as XLSX from 'xlsx';

type DadosTitulo = {
  numero: string;
  tipo: string;
  status: string;
  emitenteNome: string;
  emitenteCpfCnpj: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  dataEmissao: string;
  dataVencimento: string;
  prazo: number;
  valor: number;
  taxaCliente: number;
  taxaFornecedor: number;
  encargo: number;
  valorLiquidoCliente: number;
  custoCedente: number;
  spreadBruto: number;
  spreadLiquido: number;
  impostoProvisao: number;
  clienteNome?: string;
  fornecedorNome?: string;
};

const tipoLabel: Record<string, string> = {
  CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória',
};
const statusLabel: Record<string, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Liquidado', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
};

export function exportarTituloXLS(titulos: DadosTitulo[], nomeArquivo = 'titulos-efficaz') {
  const wb = XLSX.utils.book_new();

  // ── Aba 1: Resumo operacional ──────────────────────────
  const dadosResumo = titulos.map((t) => ({
    'Número': t.numero,
    'Tipo': tipoLabel[t.tipo] ?? t.tipo,
    'Status': statusLabel[t.status] ?? t.status,
    'Emitente': t.emitenteNome,
    'CPF/CNPJ Emitente': t.emitenteCpfCnpj,
    'Sacado': t.sacadoNome,
    'CPF/CNPJ Sacado': t.sacadoCpfCnpj,
    'Emissão': t.dataEmissao,
    'Vencimento': t.dataVencimento,
    'Prazo (dias)': t.prazo,
    'Valor (R$)': t.valor,
    'Taxa Cliente (%a.m.)': t.taxaCliente,
    'Encargo (R$)': t.encargo,
    'Líquido Cliente (R$)': t.valorLiquidoCliente,
    'Cliente': t.clienteNome ?? '',
    'Fornecedor': t.fornecedorNome ?? '',
  }));

  const ws1 = XLSX.utils.json_to_sheet(dadosResumo);
  // Largura automática das colunas
  ws1['!cols'] = Object.keys(dadosResumo[0] ?? {}).map((k) => ({
    wch: Math.max(k.length, 14),
  }));
  XLSX.utils.book_append_sheet(wb, ws1, 'Títulos');

  // ── Aba 2: Análise financeira ─────────────────────────
  const dadosFinanceiro = titulos.map((t) => ({
    'Número': t.numero,
    'Valor Bruto (R$)': t.valor,
    'Taxa Cliente (%a.m.)': t.taxaCliente,
    'Taxa Fornecedor (%a.m.)': t.taxaFornecedor,
    'Encargo (R$)': t.encargo,
    'Líquido Cliente (R$)': t.valorLiquidoCliente,
    'Custo Cedente (R$)': t.custoCedente,
    'Spread Bruto (R$)': t.spreadBruto,
    'Imposto Provisionado (R$)': t.impostoProvisao,
    'Spread Líquido (R$)': t.spreadLiquido,
    'Margem Bruta (%)': t.valor > 0 ? ((t.spreadBruto / t.valor) * 100).toFixed(2) : '0',
    'Margem Líquida (%)': t.valor > 0 ? ((t.spreadLiquido / t.valor) * 100).toFixed(2) : '0',
  }));

  const ws2 = XLSX.utils.json_to_sheet(dadosFinanceiro);
  ws2['!cols'] = Object.keys(dadosFinanceiro[0] ?? {}).map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws2, 'Análise Financeira');

  // ── Aba 3: Totais ─────────────────────────────────────
  const totalValor = titulos.reduce((s, t) => s + t.valor, 0);
  const totalEncargo = titulos.reduce((s, t) => s + t.encargo, 0);
  const totalSpreadBruto = titulos.reduce((s, t) => s + t.spreadBruto, 0);
  const totalImposto = titulos.reduce((s, t) => s + t.impostoProvisao, 0);
  const totalSpreadLiquido = titulos.reduce((s, t) => s + t.spreadLiquido, 0);

  const dadosTotais = [
    ['Relatório de Totais — Efficaz Factoring'],
    [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
    [],
    ['Indicador', 'Valor (R$)', 'Percentual'],
    ['Quantidade de Títulos', titulos.length, ''],
    ['Volume Total', totalValor, '100%'],
    ['Total de Encargos', totalEncargo, `${totalValor > 0 ? ((totalEncargo / totalValor) * 100).toFixed(2) : 0}%`],
    ['Spread Bruto Total', totalSpreadBruto, `${totalValor > 0 ? ((totalSpreadBruto / totalValor) * 100).toFixed(2) : 0}%`],
    ['Imposto Provisionado', totalImposto, `${totalSpreadBruto > 0 ? ((totalImposto / totalSpreadBruto) * 100).toFixed(2) : 0}%`],
    ['Spread Líquido Total', totalSpreadLiquido, `${totalValor > 0 ? ((totalSpreadLiquido / totalValor) * 100).toFixed(2) : 0}%`],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(dadosTotais);
  ws3['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Totais');

  XLSX.writeFile(wb, `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportarTitulosListaXLS(titulos: DadosTitulo[]) {
  exportarTituloXLS(titulos, 'titulos-efficaz');
}

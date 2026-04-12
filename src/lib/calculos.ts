/**
 * Motor de Cálculo Financeiro — Efficaz Factoring
 *
 * Fórmulas:
 * Encargo = ((Valor × TaxaCliente) ÷ 30) × Prazo
 * Se Encargo < 50, usar 50
 * ValorLiquidoCliente = Valor - Encargo
 * CustoCedente = ((Valor × TaxaFornecedor) ÷ 30) × Prazo
 * SpreadBruto = Encargo - CustoCedente
 */

import { differenceInDays } from 'date-fns';

export interface EntradaCalculo {
  valor: number;
  taxaCliente: number;       // % ao mês (ex: 3.5)
  taxaFornecedor: number;    // % ao mês (ex: 1.8)
  dataEmissao: Date;
  dataVencimento: Date;
}

export interface ResultadoCalculo {
  prazo: number;
  encargo: number;
  valorLiquidoCliente: number;
  custoCedente: number;
  spreadBruto: number;
  taxaClienteAoAno: number;
  taxaFornecedorAoAno: number;
  spreadPercentual: number;
}

export interface ResultadoFiscal {
  taxaEspelho: number;
  baseEspelho: number;
  lucroEspelho: number;
  impostoProvisao: number;
  spreadLiquido: number;
  aliquotaEfetiva: number;
}

export function calcularOperacao(entrada: EntradaCalculo): ResultadoCalculo {
  const { valor, taxaCliente, taxaFornecedor, dataEmissao, dataVencimento } = entrada;

  const prazo = differenceInDays(dataVencimento, dataEmissao);
  if (prazo <= 0) throw new Error('Data de vencimento deve ser posterior à data de emissão.');

  // Taxas em decimal
  const tcDecimal = taxaCliente / 100;
  const tfDecimal = taxaFornecedor / 100;

  // Encargo do cliente
  let encargo = ((valor * tcDecimal) / 30) * prazo;
  if (encargo < 50) encargo = 50;

  const valorLiquidoCliente = valor - encargo;

  // Custo do cedente (fornecedor de capital)
  const custoCedente = ((valor * tfDecimal) / 30) * prazo;

  // Spread bruto
  const spreadBruto = encargo - custoCedente;

  // Taxas ao ano (base 360)
  const taxaClienteAoAno = ((1 + tcDecimal) ** 12 - 1) * 100;
  const taxaFornecedorAoAno = ((1 + tfDecimal) ** 12 - 1) * 100;

  const spreadPercentual = valor > 0 ? (spreadBruto / valor) * 100 : 0;

  return {
    prazo,
    encargo: arredondar(encargo),
    valorLiquidoCliente: arredondar(valorLiquidoCliente),
    custoCedente: arredondar(custoCedente),
    spreadBruto: arredondar(spreadBruto),
    taxaClienteAoAno: arredondar(taxaClienteAoAno),
    taxaFornecedorAoAno: arredondar(taxaFornecedorAoAno),
    spreadPercentual: arredondar(spreadPercentual),
  };
}

/**
 * Motor Fiscal — Lucro Presumido
 *
 * Cria "espelho fiscal" com a menor taxa permitida (taxaMinima)
 * para reduzir a base tributária. Imposto calculado sobre o
 * lucro do espelho (~6% a 8%) e descontado antes dos repasses.
 */
export function calcularFiscal(
  resultado: ResultadoCalculo,
  valor: number,
  prazo: number,
  taxaMinima: number = 0.5,  // % ao mês (mínimo permitido)
  aliquotaImposto: number = 7 // %
): ResultadoFiscal {
  // Recalcula com a taxa mínima (espelho fiscal)
  const txEspelhoDecimal = taxaMinima / 100;
  const baseEspelho = ((valor * txEspelhoDecimal) / 30) * prazo;
  const lucroEspelho = resultado.spreadBruto - baseEspelho;

  const impostoProvisao = lucroEspelho > 0
    ? arredondar((lucroEspelho * aliquotaImposto) / 100)
    : 0;

  const spreadLiquido = arredondar(resultado.spreadBruto - impostoProvisao);
  const aliquotaEfetiva = resultado.spreadBruto > 0
    ? arredondar((impostoProvisao / resultado.spreadBruto) * 100)
    : 0;

  return {
    taxaEspelho: taxaMinima,
    baseEspelho: arredondar(baseEspelho),
    lucroEspelho: arredondar(lucroEspelho),
    impostoProvisao,
    spreadLiquido,
    aliquotaEfetiva,
  };
}

export function arredondar(valor: number, casas = 2): number {
  return Math.round(valor * 10 ** casas) / 10 ** casas;
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarPorcentagem(valor: number, casas = 2): string {
  return `${valor.toFixed(casas)}%`;
}

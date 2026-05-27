/**
 * Motor de Cálculo Financeiro — Efficaz Factoring
 *
 * Fórmulas:
 * Encargo = ((Valor × TaxaCliente) ÷ 30) × PrazoEfetivo (D+2 — benefício da empresa)
 * Se Encargo < 50, usar 50
 * ValorLiquidoCliente = Valor - Encargo
 * CustoCedente = ((Valor × TaxaFornecedor) ÷ 30) × Prazo (dias corridos — sem D+2)
 * SpreadBruto = Encargo - CustoCedente
 *
 * Regra D+2 (compensação bancária):
 * Após o vencimento, o recurso leva 2 "dias úteis bancários" para
 * ficar disponível. Sábado é válido como D+2 (destino final) mas não
 * como D+1 (passo intermediário). Domingo nunca conta.
 * Ex.: quinta → D+1=sex, D+2=sáb  |  sexta → D+1=seg, D+2=ter
 *
 * REGRA DE NEGÓCIO:
 * O benefício D+2 é exclusivo da empresa (Efficaz). O fornecedor paga
 * sobre o prazo corrido (emissão → vencimento), sem acréscimo do D+2.
 */

import { differenceInDays, addDays } from 'date-fns';

export interface EntradaCalculo {
  valor: number;
  taxaCliente: number;       // % ao mês (ex: 3.5)
  taxaFornecedor: number;    // % ao mês (ex: 1.8)
  dataEmissao: Date;
  dataVencimento: Date;
}

export interface ResultadoCalculo {
  prazo: number;          // dias originais: emissão → vencimento (face do título)
  prazoEfetivo: number;   // dias usados no cálculo: emissão → D+2
  dataD2: Date;           // data de liberação D+2
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

/**
 * Calcula a data de liberação D+2 a partir de uma data de vencimento.
 *
 * Regra:
 *  - Sábado NÃO conta como D+1 (passo intermediário), mas conta como D+2.
 *  - Domingo NUNCA conta.
 *
 * Exemplos:
 *  - Quinta  → D+1=sex, D+2=sáb  → libera sábado
 *  - Sexta   → D+1=seg, D+2=ter  → libera terça (pula sáb e dom)
 *  - Sábado  → D+1=seg, D+2=ter  → libera terça
 *  - Domingo → D+1=seg, D+2=ter  → libera terça
 */
export function calcularDataD2(dataVencimento: Date): Date {
  let count = 0;
  let current = new Date(dataVencimento);

  while (count < 2) {
    current = addDays(current, 1);
    const dow = current.getDay(); // 0=Dom, 1=Seg … 5=Sex, 6=Sáb

    if (dow === 0) continue;              // domingo: sempre pula
    if (dow === 6 && count === 0) continue; // sábado como D+1: pula

    count++;
  }

  return current;
}

export function calcularOperacao(entrada: EntradaCalculo): ResultadoCalculo {
  const { valor, taxaCliente, taxaFornecedor, dataEmissao, dataVencimento } = entrada;

  const prazo = differenceInDays(dataVencimento, dataEmissao);
  if (prazo <= 0) throw new Error('Data de vencimento deve ser posterior à data de emissão.');

  // Data e prazo efetivos considerando D+2
  const dataD2 = calcularDataD2(dataVencimento);
  const prazoEfetivo = differenceInDays(dataD2, dataEmissao);

  // Taxas em decimal
  const tcDecimal = taxaCliente / 100;
  const tfDecimal = taxaFornecedor / 100;

  // Encargo calculado sobre prazoEfetivo (D+2 — benefício da empresa)
  let encargo = ((valor * tcDecimal) / 30) * prazoEfetivo;
  if (encargo < 50) encargo = 50;

  const valorLiquidoCliente = valor - encargo;
  // CustoCedente usa prazo corrido (sem D+2 — o fornecedor não tem esse benefício)
  const custoCedente = ((valor * tfDecimal) / 30) * prazo;
  const spreadBruto = encargo - custoCedente;

  // Taxas ao ano (base 360)
  const taxaClienteAoAno = ((1 + tcDecimal) ** 12 - 1) * 100;
  const taxaFornecedorAoAno = ((1 + tfDecimal) ** 12 - 1) * 100;

  const spreadPercentual = valor > 0 ? (spreadBruto / valor) * 100 : 0;

  return {
    prazo,
    prazoEfetivo,
    dataD2,
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
 * Usa o prazoEfetivo (D+2) para calcular o espelho fiscal.
 */
export function calcularFiscal(
  resultado: ResultadoCalculo,
  valor: number,
  prazoEfetivo: number,
  taxaMinima: number = 0.5,
  aliquotaImposto: number = 15
): ResultadoFiscal {
  const txEspelhoDecimal = taxaMinima / 100;
  const baseEspelho = ((valor * txEspelhoDecimal) / 30) * prazoEfetivo;
  const lucroEspelho = resultado.spreadBruto - baseEspelho;

  const impostoCalc = baseEspelho > 0
    ? arredondar((baseEspelho * aliquotaImposto) / 100)
    : 0;
  // Imposto nunca pode exceder o spread — evita spread líquido negativo
  const impostoProvisao = Math.min(impostoCalc, Math.max(0, resultado.spreadBruto));

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


export function formatarCpfCnpj(value: string): string {
  const d = value.replace(/\D/g, '');
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return value;
}

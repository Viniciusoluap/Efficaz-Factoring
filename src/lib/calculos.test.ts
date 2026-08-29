import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  arredondar,
  calcularDataD2,
  calcularFiscal,
  calcularOperacao,
  formatarCpfCnpj,
  formatarMoeda,
  formatarPorcentagem,
  type ResultadoCalculo,
} from './calculos';

const dataLocal = (ano: number, mes: number, dia: number) => new Date(ano, mes - 1, dia, 12);
const chaveData = (data: Date) => `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;

describe('calcularDataD2', () => {
  const casos = [
    ['segunda-feira', dataLocal(2024, 1, 8), '2024-1-10'],
    ['terça-feira', dataLocal(2024, 1, 9), '2024-1-11'],
    ['quarta-feira', dataLocal(2024, 1, 10), '2024-1-12'],
    ['quinta-feira', dataLocal(2024, 1, 11), '2024-1-13'],
    ['sexta-feira', dataLocal(2024, 1, 12), '2024-1-16'],
    ['sábado', dataLocal(2024, 1, 13), '2024-1-16'],
    ['domingo', dataLocal(2024, 1, 14), '2024-1-16'],
  ] as const;

  for (const [dia, vencimento, esperado] of casos) {
    it(`calcula D+2 para ${dia}`, () => {
      assert.equal(chaveData(calcularDataD2(vencimento)), esperado);
    });
  }

  it('não modifica a data recebida', () => {
    const vencimento = dataLocal(2024, 1, 12);
    const instanteOriginal = vencimento.getTime();
    calcularDataD2(vencimento);
    assert.equal(vencimento.getTime(), instanteOriginal);
  });
});

describe('calcularOperacao', () => {
  it('calcula prazos, taxas, encargos e spreads sem incluir D+2 no custo do cedente', () => {
    const resultado = calcularOperacao({
      valor: 10_000,
      taxaCliente: 3,
      taxaFornecedor: 1.5,
      dataEmissao: dataLocal(2024, 1, 1),
      dataVencimento: dataLocal(2024, 1, 31),
    });

    assert.equal(resultado.prazo, 30);
    assert.equal(resultado.prazoEfetivo, 32);
    assert.equal(resultado.encargo, 320);
    assert.equal(resultado.valorLiquidoCliente, 9_680);
    assert.equal(resultado.custoCedente, 150);
    assert.equal(resultado.spreadBruto, 170);
    assert.equal(resultado.taxaClienteAoAno, 42.58);
    assert.equal(resultado.taxaFornecedorAoAno, 19.56);
    assert.equal(resultado.spreadPercentual, 1.7);
  });

  it('aplica o encargo mínimo e arredonda resultados monetários', () => {
    const resultado = calcularOperacao({
      valor: 1_000.01,
      taxaCliente: 0.1,
      taxaFornecedor: 0.333,
      dataEmissao: dataLocal(2024, 1, 1),
      dataVencimento: dataLocal(2024, 1, 11),
    });
    assert.equal(resultado.encargo, 50);
    assert.equal(resultado.valorLiquidoCliente, 950.01);
    assert.equal(resultado.custoCedente, 1.11);
    assert.equal(resultado.spreadBruto, 48.89);
  });

  it('aceita valor zero como entrada limítrofe mantendo o contrato atual', () => {
    const resultado = calcularOperacao({
      valor: 0,
      taxaCliente: 3,
      taxaFornecedor: 2,
      dataEmissao: dataLocal(2024, 1, 1),
      dataVencimento: dataLocal(2024, 1, 2),
    });
    assert.equal(resultado.encargo, 50);
    assert.equal(resultado.spreadPercentual, 0);
  });

  it('rejeita emissão igual ou posterior ao vencimento', () => {
    const base = { valor: 1_000, taxaCliente: 3, taxaFornecedor: 2 };
    assert.throws(() => calcularOperacao({ ...base, dataEmissao: dataLocal(2024, 1, 2), dataVencimento: dataLocal(2024, 1, 2) }), /posterior/);
    assert.throws(() => calcularOperacao({ ...base, dataEmissao: dataLocal(2024, 1, 3), dataVencimento: dataLocal(2024, 1, 2) }), /posterior/);
  });
});

describe('calcularFiscal', () => {
  const resultado = (spreadBruto: number): ResultadoCalculo => ({
    prazo: 30, prazoEfetivo: 32, dataD2: dataLocal(2024, 2, 2), encargo: 300,
    valorLiquidoCliente: 9_700, custoCedente: 100, spreadBruto,
    taxaClienteAoAno: 0, taxaFornecedorAoAno: 0, spreadPercentual: 0,
  });

  it('calcula base, lucro, imposto padrão, spread líquido e alíquota efetiva', () => {
    const fiscal = calcularFiscal(resultado(200), 10_000, 30);
    assert.deepEqual(fiscal, {
      taxaEspelho: 0.5,
      baseEspelho: 50,
      lucroEspelho: 150,
      impostoProvisao: 7.5,
      spreadLiquido: 192.5,
      aliquotaEfetiva: 3.75,
    });
  });

  it('aceita alíquotas customizadas e arredonda', () => {
    const fiscal = calcularFiscal(resultado(200), 10_000, 31, 0.7, 38.63);
    assert.equal(fiscal.baseEspelho, 72.33);
    assert.equal(fiscal.lucroEspelho, 127.67);
    assert.equal(fiscal.impostoProvisao, 27.94);
    assert.equal(fiscal.spreadLiquido, 172.06);
    assert.equal(fiscal.aliquotaEfetiva, 13.97);
  });

  it('limita o imposto ao spread bruto positivo', () => {
    assert.equal(calcularFiscal(resultado(5), 10_000, 30, 10, 100).impostoProvisao, 5);
  });

  it('não provisiona imposto para spread zero, negativo ou base não positiva', () => {
    assert.equal(calcularFiscal(resultado(0), 10_000, 30).impostoProvisao, 0);
    assert.equal(calcularFiscal(resultado(-10), 10_000, 30).impostoProvisao, 0);
    assert.equal(calcularFiscal(resultado(200), 10_000, 30, 0).impostoProvisao, 0);
    assert.equal(calcularFiscal(resultado(-10), 10_000, 30).spreadLiquido, -10);
    assert.equal(calcularFiscal(resultado(0), 10_000, 30).aliquotaEfetiva, 0);
  });
});

describe('utilitários', () => {
  it('arredonda positivos, negativos e quantidade customizada de casas', () => {
    assert.equal(arredondar(1.236), 1.24);
    assert.equal(arredondar(-1.236), -1.24);
    assert.equal(arredondar(1.23456, 3), 1.235);
  });

  it('formata moeda e porcentagem', () => {
    const moeda = formatarMoeda(1234.56).replace(/\u00a0/g, ' ');
    assert.match(moeda, /^R\$ 1\.234,56$/);
    assert.equal(formatarPorcentagem(3.456), '3.46%');
    assert.equal(formatarPorcentagem(3.456, 1), '3.5%');
  });

  it('formata CPF, CNPJ e preserva valores incompletos', () => {
    assert.equal(formatarCpfCnpj('12345678901'), '123.456.789-01');
    assert.equal(formatarCpfCnpj('12345678000199'), '12.345.678/0001-99');
    assert.equal(formatarCpfCnpj('12345'), '12345');
  });
});

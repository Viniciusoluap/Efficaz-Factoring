'use client';

import { useState } from 'react';
import { calcularOperacao, calcularFiscal, formatarMoeda, formatarPorcentagem } from '@/lib/calculos';
import { differenceInDays, format, addDays, isValid, parseISO } from 'date-fns';
import { Calculator, TrendingUp, ArrowRight, Info, Copy, CheckCheck } from 'lucide-react';

function parseData(str: string) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isValid(d) ? d : null;
}

export default function CalcularPage() {
  const [valor, setValor] = useState('');
  const [taxaCliente, setTaxaCliente] = useState('');
  const [taxaFornecedor, setTaxaFornecedor] = useState('');
  const [dataEmissao, setDataEmissao] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [prazo, setPrazo] = useState('30');
  const [dataVencimento, setDataVencimento] = useState(() => {
    return format(addDays(new Date(), 30), 'yyyy-MM-dd');
  });
  const [resultado, setResultado] = useState<ReturnType<typeof calcularOperacao> | null>(null);
  const [fiscal, setFiscal] = useState<ReturnType<typeof calcularFiscal> | null>(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Quando muda a data de emissão: mantém o prazo e recalcula o vencimento
  const handleEmissaoChange = (val: string) => {
    if (!val) return;
    setDataEmissao(val);
    const emissao = parseData(val);
    const dias = parseInt(prazo);
    if (emissao && !isNaN(dias) && dias > 0) {
      setDataVencimento(format(addDays(emissao, dias), 'yyyy-MM-dd'));
    }
  };

  // Quando muda o prazo: recalcula o vencimento
  const handlePrazoChange = (val: string) => {
    setPrazo(val);
    const dias = parseInt(val);
    const emissao = parseData(dataEmissao);
    if (emissao && !isNaN(dias) && dias > 0) {
      setDataVencimento(format(addDays(emissao, dias), 'yyyy-MM-dd'));
    }
  };

  // Quando muda o vencimento: recalcula o prazo
  const handleVencimentoChange = (val: string) => {
    if (!val) return;
    setDataVencimento(val);
    const emissao = parseData(dataEmissao);
    const venc = parseData(val);
    if (emissao && venc) {
      const dias = differenceInDays(venc, emissao);
      if (dias > 0) setPrazo(String(dias));
    }
  };

  const calcular = () => {
    setErro('');
    try {
      const dias = parseInt(prazo);
      if (!valor || !taxaCliente || !taxaFornecedor || !dataEmissao || !dataVencimento || isNaN(dias) || dias < 1) {
        setErro('Preencha todos os campos obrigatórios.');
        return;
      }
      const r = calcularOperacao({
        valor: parseFloat(valor),
        taxaCliente: parseFloat(taxaCliente),
        taxaFornecedor: parseFloat(taxaFornecedor),
        dataEmissao: new Date(dataEmissao + 'T00:00:00'),
        dataVencimento: new Date(dataVencimento + 'T00:00:00'),
      });
      setResultado(r);
      setFiscal(calcularFiscal(r, parseFloat(valor), r.prazo));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro no cálculo.');
    }
  };

  const copiarResumo = () => {
    if (!resultado || !fiscal) return;
    const txt = `EFFICAZ FACTORING — SIMULAÇÃO\n\nValor: ${formatarMoeda(parseFloat(valor))}\nPrazo: ${resultado.prazo} dias\nTaxa Cliente: ${taxaCliente}% a.m.\nTaxa Fornecedor: ${taxaFornecedor}% a.m.\n\nEncargo: ${formatarMoeda(resultado.encargo)}\nLíquido Cliente: ${formatarMoeda(resultado.valorLiquidoCliente)}\nCusto Cedente: ${formatarMoeda(resultado.custoCedente)}\nSpread Bruto: ${formatarMoeda(resultado.spreadBruto)}\nImposto Prov.: ${formatarMoeda(fiscal.impostoProvisao)}\nSpread Líquido: ${formatarMoeda(fiscal.spreadLiquido)}`;
    navigator.clipboard.writeText(txt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';

  return (
    <div className="max-w-4xl space-y-6">
      {/* Formulário */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Dados da Operação
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Valor (R$) *</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={valor}
              onChange={e => setValor(e.target.value)} placeholder="10000.00" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Taxa Cliente (% a.m.) *</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={taxaCliente}
              onChange={e => setTaxaCliente(e.target.value)} placeholder="3.50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Taxa Fornecedor (% a.m.) *</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={taxaFornecedor}
              onChange={e => setTaxaFornecedor(e.target.value)} placeholder="1.80" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Emissão *</label>
            <input type="date" className={inputCls} value={dataEmissao}
              onChange={e => { if (e.target.value) handleEmissaoChange(e.target.value); }}
              onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) handleEmissaoChange(v); }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Prazo (dias) *</label>
            <input type="number" inputMode="numeric" min="1" max="9999" className={inputCls}
              value={prazo} onChange={e => handlePrazoChange(e.target.value)} placeholder="30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Vencimento *</label>
            <input type="date" className={inputCls} value={dataVencimento}
              onChange={e => { if (e.target.value) handleVencimentoChange(e.target.value); }}
              onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) handleVencimentoChange(v); }} />
          </div>
        </div>

        {erro && (
          <p className="text-red-600 text-sm mb-3 flex items-center gap-1">
            <Info className="w-4 h-4" /> {erro}
          </p>
        )}

        <button onClick={calcular}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm">
          <Calculator className="w-4 h-4" />
          Calcular
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Resultado */}
      {resultado && fiscal && (
        <>
          {/* Motor financeiro */}
          <div className="bg-gradient-to-br from-blue-950 to-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Resultado Financeiro
                <span className="ml-2 text-xs bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
                  {resultado.prazo} dias
                </span>
              </h3>
              <button onClick={copiarResumo}
                className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                {copiado ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* Fluxo visual */}
            <div className="flex items-center justify-between mb-6 overflow-x-auto gap-2 pb-2">
              {[
                { label: 'Valor Bruto', value: formatarMoeda(parseFloat(valor)), cor: 'bg-white/10' },
                { label: '(-) Encargo', value: formatarMoeda(resultado.encargo), cor: 'bg-amber-500/20 border border-amber-500/30' },
                { label: '(=) Líquido Cliente', value: formatarMoeda(resultado.valorLiquidoCliente), cor: 'bg-green-500/20 border border-green-500/30' },
              ].map(({ label, value, cor }, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`${cor} rounded-xl p-3 text-center min-w-[140px]`}>
                    <p className="text-base font-bold">{value}</p>
                    <p className="text-xs text-white/60 mt-0.5">{label}</p>
                  </div>
                  {i < 2 && <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0" />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Custo Cedente', value: formatarMoeda(resultado.custoCedente), sub: formatarPorcentagem(Number(taxaFornecedor)) + '/mês' },
                { label: 'Spread Bruto', value: formatarMoeda(resultado.spreadBruto), sub: formatarPorcentagem(resultado.spreadPercentual) + ' do valor' },
                { label: 'Taxa Cliente a.a.', value: formatarPorcentagem(resultado.taxaClienteAoAno), sub: formatarPorcentagem(Number(taxaCliente)) + '/mês' },
                { label: 'Taxa Fornecedor a.a.', value: formatarPorcentagem(resultado.taxaFornecedorAoAno), sub: formatarPorcentagem(Number(taxaFornecedor)) + '/mês' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3">
                  <p className="text-sm font-bold">{value}</p>
                  <p className="text-xs text-white/60 mt-0.5">{label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Motor fiscal */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-xs font-bold">F</span>
              Espelho Fiscal — Lucro Presumido
            </h3>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Taxa Espelho', value: formatarPorcentagem(fiscal.taxaEspelho) + '/m', cor: 'text-gray-700' },
                { label: 'Base Espelho', value: formatarMoeda(fiscal.baseEspelho), cor: 'text-gray-700' },
                { label: 'Lucro Espelho', value: formatarMoeda(fiscal.lucroEspelho), cor: 'text-blue-600' },
                { label: 'Imposto (~7%)', value: formatarMoeda(fiscal.impostoProvisao), cor: 'text-red-600' },
                { label: 'Alíquota Efetiva', value: formatarPorcentagem(fiscal.aliquotaEfetiva), cor: 'text-orange-600' },
                { label: 'Spread Líquido', value: formatarMoeda(fiscal.spreadLiquido), cor: 'text-green-600' },
              ].map(({ label, value, cor }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-sm font-bold ${cor}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-700">
                <strong>Como funciona:</strong> O espelho fiscal recalcula a operação com a taxa mínima permitida (0,5% a.m.) para reduzir a base tributária. O imposto é calculado sobre o lucro do espelho e descontado antes dos repasses, de acordo com o regime de Lucro Presumido.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

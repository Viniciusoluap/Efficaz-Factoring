'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, Loader2, RefreshCw, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calcularOperacao, calcularFiscal } from '@/lib/calculos';

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';

type Parte = { cpfCnpj: string; nome: string };

function calcular(valor: number, taxaCliente: number, taxaFornecedor: number, dataEmissao: string, dataVencimento: string) {
  if (!dataEmissao || !dataVencimento || !valor || !taxaCliente) return null;
  try {
    const resultado = calcularOperacao({
      valor,
      taxaCliente,
      taxaFornecedor,
      dataEmissao: new Date(dataEmissao + 'T00:00:00'),
      dataVencimento: new Date(dataVencimento + 'T00:00:00'),
    });
    const fiscal = calcularFiscal(resultado, valor, resultado.prazoEfetivo);
    return {
      prazo: resultado.prazo,
      prazoEfetivo: resultado.prazoEfetivo,
      dataD2: resultado.dataD2,
      encargo: resultado.encargo,
      valorLiquidoCliente: resultado.valorLiquidoCliente,
      custoCedente: resultado.custoCedente,
      spreadBruto: resultado.spreadBruto,
      impostoProvisao: fiscal.impostoProvisao,
      spreadLiquido: fiscal.spreadLiquido,
    };
  } catch {
    return null;
  }
}

export default function EditarTituloPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [erro, setErro] = useState('');
  const [operacaoId, setOperacaoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    tipo: 'CHEQUE',
    numero: '',
    emitenteNome: '',
    emitenteCpfCnpj: '',
    sacadoNome: '',
    sacadoCpfCnpj: '',
    dataEmissao: '',
    dataVencimento: '',
    valor: '',
    taxaCliente: '',
    taxaFornecedor: '',
  });

  type CalcResult = NonNullable<ReturnType<typeof calcular>>;
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [partesEmitentes, setPartesEmitentes] = useState<Parte[]>([]);
  const [partesSacados, setPartesSacados] = useState<Parte[]>([]);
  const [sugestaoAberta, setSugestaoAberta] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const getSugestoes = (lista: Parte[], texto: string): Parte[] => {
    if (!texto || texto.length < 1) return lista.slice(0, 6);
    const lower = texto.toLowerCase();
    return lista.filter(p =>
      p.cpfCnpj.includes(texto) || p.nome.toLowerCase().includes(lower)
    ).slice(0, 6);
  };

  useEffect(() => {
    fetch('/api/titulos/partes').then(r => r.json()).then(data => {
      setPartesEmitentes(data.emitentes ?? []);
      setPartesSacados(data.sacados ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/titulos/${id}`)
      .then(r => r.json())
      .then(data => {
        const toDateInput = (iso: string) => iso ? iso.slice(0, 10) : '';
        setOperacaoId(data.operacaoId ?? null);
        const f = {
          tipo: data.tipo ?? 'CHEQUE',
          numero: data.numero ?? '',
          emitenteNome: data.emitenteNome ?? '',
          emitenteCpfCnpj: data.emitenteCpfCnpj ?? '',
          sacadoNome: data.sacadoNome ?? '',
          sacadoCpfCnpj: data.sacadoCpfCnpj ?? '',
          dataEmissao: toDateInput(data.dataEmissao),
          dataVencimento: toDateInput(data.dataVencimento),
          valor: data.valor != null ? String(Number(data.valor)) : '',
          taxaCliente: data.taxaCliente != null ? String(Number(data.taxaCliente)) : '',
          taxaFornecedor: data.taxaFornecedor != null ? String(Number(data.taxaFornecedor)) : '',
        };
        setForm(f);
        setCalc(calcular(
          Number(f.valor),
          Number(f.taxaCliente),
          Number(f.taxaFornecedor),
          f.dataEmissao,
          f.dataVencimento,
        ));
      })
      .catch(() => setErro('Erro ao carregar dados do título.'))
      .finally(() => setLoadingData(false));
  }, [id]);

  const recalcular = () => {
    setCalc(calcular(
      Number(form.valor),
      Number(form.taxaCliente),
      Number(form.taxaFornecedor),
      form.dataEmissao,
      form.dataVencimento,
    ));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!calc) { setErro('Preencha todos os campos financeiros e clique em Recalcular.'); return; }
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/titulos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: form.tipo,
          numero: form.numero,
          emitenteNome: form.emitenteNome,
          emitenteCpfCnpj: form.emitenteCpfCnpj,
          sacadoNome: form.sacadoNome,
          sacadoCpfCnpj: form.sacadoCpfCnpj,
          dataEmissao: new Date(form.dataEmissao),
          dataVencimento: new Date(form.dataVencimento),
          valor: Number(form.valor),
          taxaCliente: Number(form.taxaCliente),
          taxaFornecedor: Number(form.taxaFornecedor),
          prazo: calc.prazo,
          encargo: calc.encargo,
          valorLiquidoCliente: calc.valorLiquidoCliente,
          custoCedente: calc.custoCedente,
          spreadBruto: calc.spreadBruto,
          impostoProvisao: calc.impostoProvisao,
          spreadLiquido: calc.spreadLiquido,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar.');
      if (operacaoId) {
        router.push(`/sistema/operacoes/${operacaoId}`);
      } else {
        router.push(`/sistema/titulos/${id}`);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const voltarHref = operacaoId ? `/sistema/operacoes/${operacaoId}` : `/sistema/titulos/${id}`;
  const R = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="max-w-2xl space-y-5">
      <Link href={voltarHref} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados do título */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-700">Editar Título</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo *</label>
              <select className={inputCls} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="CHEQUE">Cheque</option>
                <option value="BOLETO">Boleto</option>
                <option value="PROMISSORIA">Promissória</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Número *</label>
              <input className={inputCls} value={form.numero} onChange={e => set('numero', e.target.value)} required />
            </div>

            <div className="col-span-2 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Emitente</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nome *</label>
                  <input className={inputCls} value={form.emitenteNome}
                    onChange={e => { set('emitenteNome', e.target.value); setSugestaoAberta('en'); }}
                    onFocus={() => setSugestaoAberta('en')}
                    onBlur={() => setTimeout(() => setSugestaoAberta(null), 150)}
                    required />
                  {sugestaoAberta === 'en' && getSugestoes(partesEmitentes, form.emitenteNome).length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                      {getSugestoes(partesEmitentes, form.emitenteNome).map(p => (
                        <li key={p.cpfCnpj}>
                          <button type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                            onMouseDown={() => { set('emitenteNome', p.nome); set('emitenteCpfCnpj', p.cpfCnpj); setSugestaoAberta(null); }}>
                            <p className="text-xs font-semibold text-gray-700">{p.nome}</p>
                            <p className="text-xs text-gray-400">{p.cpfCnpj}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">CPF / CNPJ *</label>
                  <input className={inputCls} value={form.emitenteCpfCnpj}
                    onChange={e => { set('emitenteCpfCnpj', e.target.value); setSugestaoAberta('ec'); }}
                    onFocus={() => setSugestaoAberta('ec')}
                    onBlur={() => setTimeout(() => setSugestaoAberta(null), 150)}
                    required />
                  {sugestaoAberta === 'ec' && getSugestoes(partesEmitentes, form.emitenteCpfCnpj).length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                      {getSugestoes(partesEmitentes, form.emitenteCpfCnpj).map(p => (
                        <li key={p.cpfCnpj}>
                          <button type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                            onMouseDown={() => { set('emitenteCpfCnpj', p.cpfCnpj); set('emitenteNome', p.nome); setSugestaoAberta(null); }}>
                            <p className="text-xs font-semibold text-gray-700">{p.nome}</p>
                            <p className="text-xs text-gray-400">{p.cpfCnpj}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-2 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sacado</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nome *</label>
                  <input className={inputCls} value={form.sacadoNome}
                    onChange={e => { set('sacadoNome', e.target.value); setSugestaoAberta('sn'); }}
                    onFocus={() => setSugestaoAberta('sn')}
                    onBlur={() => setTimeout(() => setSugestaoAberta(null), 150)}
                    required />
                  {sugestaoAberta === 'sn' && getSugestoes(partesSacados, form.sacadoNome).length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                      {getSugestoes(partesSacados, form.sacadoNome).map(p => (
                        <li key={p.cpfCnpj}>
                          <button type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                            onMouseDown={() => { set('sacadoNome', p.nome); set('sacadoCpfCnpj', p.cpfCnpj); setSugestaoAberta(null); }}>
                            <p className="text-xs font-semibold text-gray-700">{p.nome}</p>
                            <p className="text-xs text-gray-400">{p.cpfCnpj}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">CPF / CNPJ *</label>
                  <input className={inputCls} value={form.sacadoCpfCnpj}
                    onChange={e => { set('sacadoCpfCnpj', e.target.value); setSugestaoAberta('sc'); }}
                    onFocus={() => setSugestaoAberta('sc')}
                    onBlur={() => setTimeout(() => setSugestaoAberta(null), 150)}
                    required />
                  {sugestaoAberta === 'sc' && getSugestoes(partesSacados, form.sacadoCpfCnpj).length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                      {getSugestoes(partesSacados, form.sacadoCpfCnpj).map(p => (
                        <li key={p.cpfCnpj}>
                          <button type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                            onMouseDown={() => { set('sacadoCpfCnpj', p.cpfCnpj); set('sacadoNome', p.nome); setSugestaoAberta(null); }}>
                            <p className="text-xs font-semibold text-gray-700">{p.nome}</p>
                            <p className="text-xs text-gray-400">{p.cpfCnpj}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-700">Dados Financeiros</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Emissão *</label>
              <input type="date" className={inputCls} value={form.dataEmissao} onChange={e => set('dataEmissao', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Vencimento *</label>
              <input type="date" className={inputCls} value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" min="0.01" className={inputCls} value={form.valor} onChange={e => set('valor', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Taxa Cliente (% a.m.) *</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.taxaCliente} onChange={e => set('taxaCliente', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Taxa Fornecedor (% a.m.)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.taxaFornecedor} onChange={e => set('taxaFornecedor', e.target.value)} />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={recalcular}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm border border-blue-200"
              >
                <RefreshCw className="w-4 h-4" /> Recalcular
              </button>
            </div>
          </div>

          {calc && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                <CalendarClock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-xs text-blue-700">
                  Prazo face: <strong>{calc.prazo}d</strong> · Prazo D+2 efetivo: <strong>{calc.prazoEfetivo}d</strong> · Liberação: <strong>{format(calc.dataD2, "dd/MM/yyyy (EEE)", { locale: ptBR })}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Encargo (D+2)', value: R(calc.encargo) },
                  { label: 'Líquido Cliente', value: R(calc.valorLiquidoCliente) },
                  { label: 'Custo Cedente', value: R(calc.custoCedente) },
                  { label: 'Spread Bruto', value: R(calc.spreadBruto) },
                  { label: 'Imposto Prov.', value: R(calc.impostoProvisao) },
                  { label: 'Spread Líquido', value: R(calc.spreadLiquido) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!calc && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Preencha os campos financeiros e clique em Recalcular para ver os resultados.
            </p>
          )}
        </div>

        {erro && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !calc}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <Link href={voltarHref} className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { calcularOperacao, calcularFiscal, formatarMoeda } from '@/lib/calculos';
import { differenceInDays, format, addDays, isValid } from 'date-fns';
import { Save, Calculator, AlertCircle, ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Lock, Copy } from 'lucide-react';
import Link from 'next/link';
import OcrCheque from '@/components/sistema/OcrCheque';

type Parte = { cpfCnpj: string; nome: string };

const hoje = format(new Date(), 'yyyy-MM-dd');

type TituloItem = {
  id: string;
  tipo: string;
  numero: string;
  emitenteCpfCnpj: string;
  emitenteNome: string;
  sacadoCpfCnpj: string;
  sacadoNome: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: string;
};

function novaTituloItem(): TituloItem {
  return {
    id: Math.random().toString(36).slice(2),
    tipo: 'CHEQUE', numero: '', emitenteCpfCnpj: '', emitenteNome: '',
    sacadoCpfCnpj: '', sacadoNome: '', dataEmissao: hoje, dataVencimento: '', valor: '',
  };
}

function calcPreview(t: TituloItem, taxaCliente: string, taxaFornecedor: string) {
  if (!t.valor || !t.dataEmissao || !t.dataVencimento || !taxaCliente || !taxaFornecedor) return null;
  try {
    const r = calcularOperacao({
      valor: parseFloat(t.valor),
      taxaCliente: parseFloat(taxaCliente),
      taxaFornecedor: parseFloat(taxaFornecedor),
      dataEmissao: new Date(t.dataEmissao + 'T00:00:00'),
      dataVencimento: new Date(t.dataVencimento + 'T00:00:00'),
    });
    return r;
  } catch { return null; }
}

export default function NovoTituloPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const operacaoId = searchParams.get('operacaoId');

  const [etapa, setEtapa] = useState<'configurar' | 'titulos'>('configurar');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [operacaoExistente, setOperacaoExistente] = useState<{ numero: string } | null>(null);

  // Params fixos da operação
  const [taxaCliente, setTaxaCliente] = useState('');
  const [taxaFornecedor, setTaxaFornecedor] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Lista de títulos
  const [titulos, setTitulos] = useState<TituloItem[]>([novaTituloItem()]);
  const [expandido, setExpandido] = useState<string>(titulos[0].id);
  const [replicarAberto, setReplicarAberto] = useState<{ id: string; tipo: 'emitente' | 'sacado' } | null>(null);

  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);
  const [partesEmitentes, setPartesEmitentes] = useState<Parte[]>([]);
  const [partesSacados, setPartesSacados] = useState<Parte[]>([]);
  const [sugestaoAberta, setSugestaoAberta] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/clientes?ativo=true').then(r => r.json()).then(setClientes).catch(() => {});
    fetch('/api/fornecedores?ativo=true').then(r => r.json()).then(setFornecedores).catch(() => {});
    fetch('/api/titulos/partes').then(r => r.json()).then(data => {
      setPartesEmitentes(data.emitentes ?? []);
      setPartesSacados(data.sacados ?? []);
    }).catch(() => {});
  }, []);

  // Se vier com operacaoId, carrega os parâmetros da operação e pula etapa 1
  useEffect(() => {
    if (!operacaoId) return;
    fetch(`/api/operacoes/${operacaoId}`)
      .then(r => r.json())
      .then(op => {
        setTaxaCliente(String(op.taxaCliente));
        setTaxaFornecedor(String(op.taxaFornecedor));
        setClienteId(op.clienteId ?? '');
        setFornecedorId(op.fornecedorId ?? '');
        setObservacoes(op.observacoes ?? '');
        setOperacaoExistente({ numero: op.numero });
        setEtapa('titulos');
      })
      .catch(() => {});
  }, [operacaoId]);

  const mergePartes = (fromDB: Parte[], fromForm: Parte[]): Parte[] => {
    const map = new Map<string, Parte>();
    [...fromDB, ...fromForm].forEach(p => { if (p.cpfCnpj) map.set(p.cpfCnpj, p); });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  };

  const getSugestoes = (fromDB: Parte[], fromForm: Parte[], texto: string): Parte[] => {
    const lista = mergePartes(fromDB, fromForm);
    if (!texto || texto.length < 1) return lista.slice(0, 6);
    const lower = texto.toLowerCase();
    return lista.filter(p => p.cpfCnpj.includes(texto) || p.nome.toLowerCase().includes(lower)).slice(0, 6);
  };

  const selecionarEmitente = (id: string, p: Parte) => {
    setTitulos(prev => prev.map(t => t.id !== id ? t : { ...t, emitenteCpfCnpj: p.cpfCnpj, emitenteNome: p.nome }));
    setSugestaoAberta(null);
  };

  const selecionarSacado = (id: string, p: Parte) => {
    setTitulos(prev => prev.map(t => t.id !== id ? t : { ...t, sacadoCpfCnpj: p.cpfCnpj, sacadoNome: p.nome }));
    setSugestaoAberta(null);
  };

  useEffect(() => {
    if (!replicarAberto) return;
    const handler = () => setReplicarAberto(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [replicarAberto]);

  const setTitulo = (id: string, campo: keyof TituloItem, valor: string) => {
    setTitulos(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, [campo]: valor };
      // Sincroniza vencimento ao mudar emissão (mantém prazo se vencimento já existe)
      if (campo === 'dataEmissao' && t.dataVencimento && valor) {
        const emissao = new Date(valor + 'T00:00:00');
        const venc = new Date(t.dataVencimento + 'T00:00:00');
        if (isValid(emissao) && isValid(venc)) {
          const dias = differenceInDays(venc, emissao);
          if (dias > 0) return updated;
        }
      }
      return updated;
    }));
  };

  const adicionarTitulo = () => {
    const novo = novaTituloItem();
    setTitulos(prev => [...prev, novo]);
    setExpandido(novo.id);
  };

  const removerTitulo = (id: string) => {
    if (titulos.length === 1) return;
    setTitulos(prev => prev.filter(t => t.id !== id));
  };

  const replicarEmitente = (targetId: string, source: TituloItem) => {
    setTitulos(prev => prev.map(t =>
      t.id !== targetId ? t : { ...t, emitenteCpfCnpj: source.emitenteCpfCnpj, emitenteNome: source.emitenteNome }
    ));
    setReplicarAberto(null);
  };

  const replicarSacado = (targetId: string, source: TituloItem) => {
    setTitulos(prev => prev.map(t =>
      t.id !== targetId ? t : { ...t, sacadoCpfCnpj: source.sacadoCpfCnpj, sacadoNome: source.sacadoNome }
    ));
    setReplicarAberto(null);
  };

  const confirmarEtapa1 = () => {
    if (!taxaCliente || !taxaFornecedor) {
      setErro('Informe as taxas da operação para continuar.');
      return;
    }
    setErro('');
    setEtapa('titulos');
  };

  const handleFinalizar = async () => {
    // Valida todos os títulos
    for (const t of titulos) {
      if (!t.tipo || !t.numero || !t.emitenteCpfCnpj || !t.emitenteNome ||
          !t.sacadoCpfCnpj || !t.sacadoNome || !t.dataEmissao || !t.dataVencimento || !t.valor) {
        setErro('Preencha todos os campos obrigatórios em todos os títulos.');
        return;
      }
    }
    setLoading(true); setErro('');
    try {
      const res = await fetch('/api/operacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxaCliente, taxaFornecedor, clienteId, fornecedorId, observacoes, titulos, operacaoId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar.');
      const data = await res.json();
      router.push(operacaoId ? `/sistema/operacoes/${operacaoId}` : '/sistema/titulos');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';
  const totalVolume = titulos.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);

  return (
    <div className="max-w-4xl space-y-5">
      <Link
        href={operacaoId ? `/sistema/operacoes/${operacaoId}` : '/sistema/titulos'}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        {operacaoExistente ? `Voltar para Operação ${operacaoExistente.numero}` : 'Voltar'}
      </Link>

      {/* Stepper */}
      <div className="flex items-center gap-3">
        {[
          { num: 1, label: 'Parâmetros da Operação', etapaKey: 'configurar' },
          { num: 2, label: 'Títulos', etapaKey: 'titulos' },
        ].map(({ num, label, etapaKey }, i) => (
          <div key={num} className="flex items-center gap-2">
            {i > 0 && <div className={`h-px w-8 ${etapa === 'titulos' ? 'bg-blue-400' : 'bg-gray-200'}`} />}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              etapa === etapaKey ? 'bg-blue-600 text-white' :
              (etapaKey === 'configurar' && etapa === 'titulos') ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {etapaKey === 'configurar' && etapa === 'titulos'
                ? <CheckCircle2 className="w-4 h-4" />
                : <span className="w-4 h-4 text-center text-xs font-bold">{num}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ETAPA 1: Parâmetros ── */}
      {etapa === 'configurar' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">1</span>
              Taxas da Operação
              <span className="text-xs text-gray-400 font-normal ml-1">— aplicadas a todos os títulos</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Taxa Cliente (% a.m.) *</label>
                <input type="number" step="0.01" min="0.01" className={inputCls}
                  value={taxaCliente} onChange={e => setTaxaCliente(e.target.value)}
                  placeholder="3.50" />
              </div>
              <div>
                <label className={labelCls}>Taxa Fornecedor (% a.m.) *</label>
                <input type="number" step="0.01" min="0.01" className={inputCls}
                  value={taxaFornecedor} onChange={e => setTaxaFornecedor(e.target.value)}
                  placeholder="1.80" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">2</span>
              Custódia e Observações
              <span className="text-xs text-gray-400 font-normal ml-1">— compartilhados entre todos os títulos</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Cliente Custodiante</label>
                <select className={inputCls} value={clienteId} onChange={e => setClienteId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Fornecedor de Capital</label>
                <select className={inputCls} value={fornecedorId} onChange={e => setFornecedorId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Observações</label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={observacoes}
                onChange={e => setObservacoes(e.target.value)} placeholder="Informações adicionais..." />
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
            </div>
          )}

          <button onClick={confirmarEtapa1}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm">
            Continuar — Adicionar Títulos
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── ETAPA 2: Títulos ── */}
      {etapa === 'titulos' && (
        <div className="space-y-4">
          {/* Banner de parâmetros fixos */}
          <div className="bg-blue-950 rounded-2xl px-5 py-4 text-white flex flex-wrap items-center gap-4">
            <Lock className="w-4 h-4 text-blue-300 flex-shrink-0" />
            <div className="flex flex-wrap gap-4 flex-1 text-sm">
              {operacaoExistente && (
                <span className="text-amber-400 font-semibold">Operação {operacaoExistente.numero}</span>
              )}
              <span>Taxa Cliente: <strong className="text-amber-400">{taxaCliente}% a.m.</strong></span>
              <span>Taxa Fornecedor: <strong className="text-amber-400">{taxaFornecedor}% a.m.</strong></span>
              {clientes.find(c => c.id === clienteId) && (
                <span>Cliente: <strong>{clientes.find(c => c.id === clienteId)?.nome}</strong></span>
              )}
              {fornecedores.find(f => f.id === fornecedorId) && (
                <span>Fornecedor: <strong>{fornecedores.find(f => f.id === fornecedorId)?.nome}</strong></span>
              )}
            </div>
            {!operacaoExistente && (
              <button onClick={() => setEtapa('configurar')}
                className="text-xs text-blue-300 hover:text-white underline">
                Editar
              </button>
            )}
          </div>

          {/* Cards de títulos */}
          {titulos.map((t, idx) => {
            const preview = calcPreview(t, taxaCliente, taxaFornecedor);
            const aberto = expandido === t.id;
            const prazo = t.dataEmissao && t.dataVencimento
              ? differenceInDays(new Date(t.dataVencimento + 'T00:00:00'), new Date(t.dataEmissao + 'T00:00:00'))
              : null;
            const completo = !!(t.numero && t.emitenteCpfCnpj && t.emitenteNome && t.sacadoCpfCnpj && t.sacadoNome && t.dataEmissao && t.dataVencimento && t.valor);

            return (
              <div key={t.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${aberto ? 'border-blue-300' : 'border-gray-100'}`}>
                {/* Header do card */}
                <button className="w-full flex items-center gap-3 px-5 py-4 text-left"
                  onClick={() => setExpandido(aberto ? '' : t.id)}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    completo ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
                    {completo ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      Título {idx + 1} {t.numero ? `— ${t.tipo} ${t.numero}` : ''}
                    </p>
                    {t.valor && <p className="text-xs text-gray-500">{formatarMoeda(parseFloat(t.valor))}{prazo ? ` · ${prazo} dias` : ''}</p>}
                  </div>
                  {titulos.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); removerTitulo(t.id); }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {aberto ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>

                {/* Conteúdo expandido */}
                {aberto && (
                  <div className="px-5 pb-5 space-y-5 border-t border-gray-50 pt-4">
                    {/* OCR */}
                    {t.tipo === 'CHEQUE' && (
                      <OcrCheque onExtrair={(dados) => {
                        if (dados.numero) setTitulo(t.id, 'numero', dados.numero);
                        if (dados.valor) setTitulo(t.id, 'valor', dados.valor);
                        if (dados.data) {
                          const p = dados.data.split('/');
                          if (p.length === 3) setTitulo(t.id, 'dataVencimento', `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`);
                        }
                        if (dados.emitenteCpfCnpj) setTitulo(t.id, 'emitenteCpfCnpj', dados.emitenteCpfCnpj);
                        if (dados.emitenteNome) setTitulo(t.id, 'emitenteNome', dados.emitenteNome);
                        if (dados.emitenteCpfCnpj) setTitulo(t.id, 'sacadoCpfCnpj', dados.emitenteCpfCnpj);
                        if (dados.emitenteNome) setTitulo(t.id, 'sacadoNome', dados.emitenteNome);
                      }} />
                    )}

                    {/* Dados do título */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className={labelCls}>Tipo *</label>
                        <select className={inputCls} value={t.tipo} onChange={e => setTitulo(t.id, 'tipo', e.target.value)}>
                          <option value="CHEQUE">Cheque</option>
                          <option value="BOLETO">Boleto</option>
                          <option value="PROMISSORIA">Promissória</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Número *</label>
                        <input className={inputCls} value={t.numero} onChange={e => setTitulo(t.id, 'numero', e.target.value)} placeholder="000123" />
                      </div>
                      <div>
                        <label className={labelCls}>Emissão *</label>
                        <input type="date" className={inputCls} value={t.dataEmissao}
                          onChange={e => { if (e.target.value) setTitulo(t.id, 'dataEmissao', e.target.value); }}
                          onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTitulo(t.id, 'dataEmissao', v); }} />
                      </div>
                      <div>
                        <label className={labelCls}>Vencimento *</label>
                        <input type="date" className={inputCls} value={t.dataVencimento}
                          onChange={e => { if (e.target.value) setTitulo(t.id, 'dataVencimento', e.target.value); }}
                          onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTitulo(t.id, 'dataVencimento', v); }} />
                      </div>
                    </div>

                    {/* Partes */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* EMITENTE */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-500 uppercase">Emitente</p>
                          {titulos.filter(o => o.id !== t.id && o.emitenteNome).length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setReplicarAberto(prev => prev?.id === t.id && prev.tipo === 'emitente' ? null : { id: t.id, tipo: 'emitente' }); }}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Copy className="w-3 h-3" /> Repetir de
                              </button>
                              {replicarAberto?.id === t.id && replicarAberto.tipo === 'emitente' && (
                                <div onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 min-w-[200px] py-1">
                                  {titulos.filter(o => o.id !== t.id && o.emitenteNome).map((o) => (
                                    <button key={o.id} type="button"
                                      onClick={() => replicarEmitente(t.id, o)}
                                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors">
                                      <p className="text-xs font-semibold text-gray-700">{o.emitenteNome}</p>
                                      <p className="text-xs text-gray-400">{o.emitenteCpfCnpj}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label className={labelCls}>CPF/CNPJ *</label>
                          <input
                            className={inputCls}
                            value={t.emitenteCpfCnpj}
                            onChange={e => { setTitulo(t.id, 'emitenteCpfCnpj', e.target.value); setSugestaoAberta(`${t.id}_ec`); }}
                            onFocus={() => setSugestaoAberta(`${t.id}_ec`)}
                            onBlur={() => setTimeout(() => setSugestaoAberta(null), 150)}
                            placeholder="000.000.000-00"
                          />
                          {sugestaoAberta === `${t.id}_ec` && getSugestoes(partesEmitentes, titulos.filter(o => o.id !== t.id && o.emitenteCpfCnpj).map(o => ({ cpfCnpj: o.emitenteCpfCnpj, nome: o.emitenteNome })), t.emitenteCpfCnpj).length > 0 && (
                            <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                              {getSugestoes(partesEmitentes, titulos.filter(o => o.id !== t.id && o.emitenteCpfCnpj).map(o => ({ cpfCnpj: o.emitenteCpfCnpj, nome: o.emitenteNome })), t.emitenteCpfCnpj).map(p => (
                                <li key={p.cpfCnpj}>
                                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                                    onMouseDown={() => selecionarEmitente(t.id, p)}>
                                    <p className="text-xs font-semibold text-gray-700">{p.nome}</p>
                                    <p className="text-xs text-gray-400">{p.cpfCnpj}</p>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="relative">
                          <label className={labelCls}>Nome / Razão Social *</label>
                          <input
                            className={inputCls}
                            value={t.emitenteNome}
                            onChange={e => { setTitulo(t.id, 'emitenteNome', e.target.value); setSugestaoAberta(`${t.id}_en`); }}
                            onFocus={() => setSugestaoAberta(`${t.id}_en`)}
                            onBlur={() => setTimeout(() => setSugestaoAberta(null), 150)}
                            placeholder="Nome completo"
                          />
                          {sugestaoAberta === `${t.id}_en` && getSugestoes(partesEmitentes, titulos.filter(o => o.id !== t.id && o.emitenteCpfCnpj).map(o => ({ cpfCnpj: o.emitenteCpfCnpj, nome: o.emitenteNome })), t.emitenteNome).length > 0 && (
                            <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                              {getSugestoes(partesEmitentes, titulos.filter(o => o.id !== t.id && o.emitenteCpfCnpj).map(o => ({ cpfCnpj: o.emitenteCpfCnpj, nome: o.emitenteNome })), t.emitenteNome).map(p => (
                                <li key={p.cpfCnpj}>
                                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                                    onMouseDown={() => selecionarEmitente(t.id, p)}>
                                    <p className="text-xs font-semibold text-gray-700">{p.nome}</p>
                                    <p className="text-xs text-gray-400">{p.cpfCnpj}</p>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* SACADO */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-500 uppercase">Sacado</p>
                          {titulos.filter(o => o.id !== t.id && o.sacadoNome).length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setReplicarAberto(prev => prev?.id === t.id && prev.tipo === 'sacado' ? null : { id: t.id, tipo: 'sacado' }); }}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Copy className="w-3 h-3" /> Repetir de
                              </button>
                              {replicarAberto?.id === t.id && replicarAberto.tipo === 'sacado' && (
                                <div onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 min-w-[200px] py-1">
                                  {titulos.filter(o => o.id !== t.id && o.sacadoNome).map((o) => (
                                    <button key={o.id} type="button"
                                      onClick={() => replicarSacado(t.id, o)}
                                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors">
                                      <p className="text-xs font-semibold text-gray-700">{o.sacadoNome}</p>
                                      <p className="text-xs text-gray-400">{o.sacadoCpfCnpj}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label className={labelCls}>CPF/CNPJ *</label>
                          <input
                            className={inputCls}
                            value={t.sacadoCpfCnpj}
                            onChange={e => { setTitulo(t.id, 'sacadoCpfCnpj', e.target.value); setSugestaoAberta(`${t.id}_sc`); }}
                            onFocus={() => setSugestaoAberta(`${t.id}_sc`)}
                            onBlur={() => setTimeout(() => setSugestaoAberta(null), 150)}
                            placeholder="000.000.000-00"
                          />
                          {sugestaoAberta === `${t.id}_sc` && getSugestoes(partesSacados, titulos.filter(o => o.id !== t.id && o.sacadoCpfCnpj).map(o => ({ cpfCnpj: o.sacadoCpfCnpj, nome: o.sacadoNome })), t.sacadoCpfCnpj).length > 0 && (
                            <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                              {getSugestoes(partesSacados, titulos.filter(o => o.id !== t.id && o.sacadoCpfCnpj).map(o => ({ cpfCnpj: o.sacadoCpfCnpj, nome: o.sacadoNome })), t.sacadoCpfCnpj).map(p => (
                                <li key={p.cpfCnpj}>
                                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                                    onMouseDown={() => selecionarSacado(t.id, p)}>
                                    <p className="text-xs font-semibold text-gray-700">{p.nome}</p>
                                    <p className="text-xs text-gray-400">{p.cpfCnpj}</p>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="relative">
                          <label className={labelCls}>Nome / Razão Social *</label>
                          <input
                            className={inputCls}
                            value={t.sacadoNome}
                            onChange={e => { setTitulo(t.id, 'sacadoNome', e.target.value); setSugestaoAberta(`${t.id}_sn`); }}
                            onFocus={() => setSugestaoAberta(`${t.id}_sn`)}
                            onBlur={() => setTimeout(() => setSugestaoAberta(null), 150)}
                            placeholder="Nome completo"
                          />
                          {sugestaoAberta === `${t.id}_sn` && getSugestoes(partesSacados, titulos.filter(o => o.id !== t.id && o.sacadoCpfCnpj).map(o => ({ cpfCnpj: o.sacadoCpfCnpj, nome: o.sacadoNome })), t.sacadoNome).length > 0 && (
                            <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                              {getSugestoes(partesSacados, titulos.filter(o => o.id !== t.id && o.sacadoCpfCnpj).map(o => ({ cpfCnpj: o.sacadoCpfCnpj, nome: o.sacadoNome })), t.sacadoNome).map(p => (
                                <li key={p.cpfCnpj}>
                                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                                    onMouseDown={() => selecionarSacado(t.id, p)}>
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

                    {/* Valor */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className={labelCls}>Valor (R$) *</label>
                        <input type="number" step="0.01" min="0.01" className={inputCls}
                          value={t.valor} onChange={e => setTitulo(t.id, 'valor', e.target.value)} placeholder="0,00" />
                      </div>
                      <div>
                        <label className={labelCls}>Prazo</label>
                        <div className={`${inputCls} bg-gray-100 text-gray-500 cursor-default`}>
                          {prazo !== null && prazo > 0 ? `${prazo} dias` : '—'}
                        </div>
                      </div>
                      {preview && (
                        <>
                          <div>
                            <label className={labelCls}>Encargo</label>
                            <div className={`${inputCls} bg-amber-50 text-amber-700 font-semibold cursor-default`}>{formatarMoeda(preview.encargo)}</div>
                          </div>
                          <div>
                            <label className={labelCls}>Líquido Cliente</label>
                            <div className={`${inputCls} bg-green-50 text-green-700 font-semibold cursor-default`}>{formatarMoeda(preview.valorLiquidoCliente)}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Resumo + botões */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-500">
                {titulos.length} título{titulos.length !== 1 ? 's' : ''} · Volume total:
                <strong className="text-blue-600 ml-1">{formatarMoeda(totalVolume)}</strong>
              </p>
            </div>
            <button onClick={adicionarTitulo}
              className="flex items-center gap-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Adicionar Título
            </button>
            <button onClick={handleFinalizar} disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm text-sm">
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : operacaoExistente ? `Adicionar ${titulos.length} título${titulos.length !== 1 ? 's' : ''} à Operação` : `Finalizar Operação (${titulos.length} título${titulos.length !== 1 ? 's' : ''})`}
            </button>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

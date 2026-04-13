'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calcularOperacao, calcularFiscal, formatarMoeda } from '@/lib/calculos';
import { differenceInDays, format } from 'date-fns';
import { Save, Calculator, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import OcrCheque from '@/components/sistema/OcrCheque';

const hoje = format(new Date(), 'yyyy-MM-dd');

export default function NovoTituloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    tipo: 'CHEQUE',
    numero: '',
    emitenteCpfCnpj: '',
    emitenteNome: '',
    sacadoCpfCnpj: '',
    sacadoNome: '',
    dataEmissao: hoje,
    dataVencimento: '',
    valor: '',
    taxaCliente: '',
    taxaFornecedor: '',
    clienteId: '',
    fornecedorId: '',
    observacoes: '',
  });

  const [preview, setPreview] = useState<ReturnType<typeof calcularOperacao> | null>(null);
  const [fiscal, setFiscal] = useState<ReturnType<typeof calcularFiscal> | null>(null);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetch('/api/clientes?ativo=true').then(r => r.json()).then(setClientes).catch(() => {});
    fetch('/api/fornecedores?ativo=true').then(r => r.json()).then(setFornecedores).catch(() => {});
  }, []);

  useEffect(() => {
    const { valor, taxaCliente, taxaFornecedor, dataEmissao, dataVencimento } = form;
    if (valor && taxaCliente && taxaFornecedor && dataEmissao && dataVencimento) {
      try {
        const resultado = calcularOperacao({
          valor: parseFloat(valor),
          taxaCliente: parseFloat(taxaCliente),
          taxaFornecedor: parseFloat(taxaFornecedor),
          dataEmissao: new Date(dataEmissao),
          dataVencimento: new Date(dataVencimento),
        });
        setPreview(resultado);
        setFiscal(calcularFiscal(resultado, parseFloat(valor), resultado.prazo));
      } catch { setPreview(null); setFiscal(null); }
    } else {
      setPreview(null); setFiscal(null);
    }
  }, [form.valor, form.taxaCliente, form.taxaFornecedor, form.dataEmissao, form.dataVencimento]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErro('');
    try {
      const res = await fetch('/api/titulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar.');
      router.push('/sistema/titulos');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="max-w-5xl space-y-5">
      <Link href="/sistema/titulos" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados do título */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">1</span>
            Dados do Título
          </h2>
          {form.tipo === 'CHEQUE' && (
            <div className="mb-4">
              <OcrCheque
                onExtrair={(dados) => {
                  if (dados.numero) set('numero', dados.numero);
                  if (dados.valor) set('valor', dados.valor.replace(',', '.'));
                  if (dados.data) {
                    const partes = dados.data.split('/');
                    if (partes.length === 3) {
                      set('dataVencimento', `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`);
                    }
                  }
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Tipo *</label>
              <select className={inputCls} value={form.tipo} onChange={e => set('tipo', e.target.value)} required>
                <option value="CHEQUE">Cheque</option>
                <option value="BOLETO">Boleto</option>
                <option value="PROMISSORIA">Promissória</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Número *</label>
              <input className={inputCls} value={form.numero} onChange={e => set('numero', e.target.value)} required placeholder="Ex: 000123" />
            </div>
            <div>
              <label className={labelCls}>Data de Emissão *</label>
              <input type="date" className={inputCls} value={form.dataEmissao} onChange={e => set('dataEmissao', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Data de Vencimento *</label>
              <input type="date" className={inputCls} value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} required min={form.dataEmissao} />
            </div>
          </div>
        </div>

        {/* Emitente e sacado */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">2</span>
            Partes Envolvidas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase">Emitente</p>
              <div>
                <label className={labelCls}>CPF/CNPJ *</label>
                <input className={inputCls} value={form.emitenteCpfCnpj} onChange={e => set('emitenteCpfCnpj', e.target.value)} required placeholder="000.000.000-00" />
              </div>
              <div>
                <label className={labelCls}>Nome / Razão Social *</label>
                <input className={inputCls} value={form.emitenteNome} onChange={e => set('emitenteNome', e.target.value)} required placeholder="Nome completo" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase">Sacado</p>
              <div>
                <label className={labelCls}>CPF/CNPJ *</label>
                <input className={inputCls} value={form.sacadoCpfCnpj} onChange={e => set('sacadoCpfCnpj', e.target.value)} required placeholder="000.000.000-00" />
              </div>
              <div>
                <label className={labelCls}>Nome / Razão Social *</label>
                <input className={inputCls} value={form.sacadoNome} onChange={e => set('sacadoNome', e.target.value)} required placeholder="Nome completo" />
              </div>
            </div>
          </div>
        </div>

        {/* Valores e taxas */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">3</span>
            Valores e Taxas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Valor (R$) *</label>
              <input type="number" step="0.01" min="0.01" className={inputCls} value={form.valor} onChange={e => set('valor', e.target.value)} required placeholder="0,00" />
            </div>
            <div>
              <label className={labelCls}>Taxa Cliente (% a.m.) *</label>
              <input type="number" step="0.01" min="0.01" className={inputCls} value={form.taxaCliente} onChange={e => set('taxaCliente', e.target.value)} required placeholder="3.50" />
            </div>
            <div>
              <label className={labelCls}>Taxa Fornecedor (% a.m.) *</label>
              <input type="number" step="0.01" min="0.01" className={inputCls} value={form.taxaFornecedor} onChange={e => set('taxaFornecedor', e.target.value)} required placeholder="1.80" />
            </div>
            <div>
              <label className={labelCls}>Prazo (dias)</label>
              <input className={`${inputCls} bg-gray-100 cursor-not-allowed`} readOnly
                value={form.dataEmissao && form.dataVencimento
                  ? `${Math.max(0, differenceInDays(new Date(form.dataVencimento), new Date(form.dataEmissao)))} dias`
                  : '—'} />
            </div>
          </div>
        </div>

        {/* Preview financeiro */}
        {preview && fiscal && (
          <div className="bg-gradient-to-br from-blue-950 to-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Preview do Cálculo</h3>
              <span className="ml-auto text-xs bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">{preview.prazo} dias</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Encargo', value: formatarMoeda(preview.encargo), cor: 'text-amber-400' },
                { label: 'Líquido Cliente', value: formatarMoeda(preview.valorLiquidoCliente), cor: 'text-green-400' },
                { label: 'Custo Fornecedor', value: formatarMoeda(preview.custoCedente), cor: 'text-blue-300' },
                { label: 'Spread Bruto', value: formatarMoeda(preview.spreadBruto), cor: 'text-purple-300' },
              ].map(({ label, value, cor }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold ${cor}`}>{value}</p>
                  <p className="text-xs text-white/60 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              {[
                { label: 'Espelho Fiscal', value: formatarMoeda(fiscal.baseEspelho) },
                { label: 'Imposto Provisionado', value: formatarMoeda(fiscal.impostoProvisao), cor: 'text-red-300' },
                { label: 'Spread Líquido', value: formatarMoeda(fiscal.spreadLiquido), cor: 'text-emerald-400' },
              ].map(({ label, value, cor }) => (
                <div key={label} className="text-center">
                  <p className={`text-base font-bold ${cor ?? 'text-white'}`}>{value}</p>
                  <p className="text-xs text-white/50">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custódia */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">4</span>
            Custódia e Observações
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Cliente Custodiante</label>
              <select className={inputCls} value={form.clienteId} onChange={e => set('clienteId', e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fornecedor de Capital</label>
              <select className={inputCls} value={form.fornecedorId} onChange={e => set('fornecedorId', e.target.value)}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Observações</label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Informações adicionais..." />
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60 shadow-sm">
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Título'}
          </button>
          <Link href="/sistema/titulos" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-3 rounded-xl transition-colors text-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

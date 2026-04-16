'use client';

import { useEffect, useState } from 'react';
import { Save, Settings, AlertCircle, CheckCircle } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [form, setForm] = useState({
    nomeEmpresa: '', cnpj: '', emailSistema: '',
    taxaMinimaFiscal: '0.5', aliquotaImposto: '15',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle');

  useEffect(() => {
    fetch('/api/configuracoes').then(r => r.json()).then(d => {
      if (d) setForm({
        nomeEmpresa: d.nomeEmpresa ?? '',
        cnpj: d.cnpj ?? '',
        emailSistema: d.emailSistema ?? '',
        taxaMinimaFiscal: String(d.taxaMinimaFiscal ?? 0.5),
        aliquotaImposto: String(d.aliquotaImposto ?? 15),
      });
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setStatus('idle');
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'ok' : 'erro');
    } catch { setStatus('erro'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <form onSubmit={salvar} className="space-y-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Empresa
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome da Empresa</label>
              <input className={inputCls} value={form.nomeEmpresa} onChange={e => set('nomeEmpresa', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CNPJ</label>
              <input className={inputCls} value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail do Sistema</label>
              <input type="email" className={inputCls} value={form.emailSistema} onChange={e => set('emailSistema', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-700">Motor Fiscal — Lucro Presumido</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Taxa Mínima Fiscal (% a.m.)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.taxaMinimaFiscal} onChange={e => set('taxaMinimaFiscal', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Usada no espelho fiscal para reduzir a base tributária.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Alíquota de Imposto (%)</label>
              <input type="number" step="0.1" min="0" max="100" className={inputCls} value={form.aliquotaImposto} onChange={e => set('aliquotaImposto', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Normalmente entre 6% e 8% (Lucro Presumido).</p>
            </div>
          </div>
        </div>

        {status === 'ok' && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" /> Configurações salvas com sucesso!
          </div>
        )}
        {status === 'erro' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" /> Erro ao salvar. Tente novamente.
          </div>
        )}

        <button type="submit" disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm shadow-sm">
          <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  );
}

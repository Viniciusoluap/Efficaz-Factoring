'use client';

import { useEffect, useState } from 'react';
import { Save, Settings, AlertCircle, CheckCircle, Info, Building2 } from 'lucide-react';

const defaultForm = {
  nomeEmpresa: 'Efficaz Factoring',
  cnpj: '04.578.232/0001-82',
  emailSistema: 'contato@grupoefficaz.com.br',
  telefone: '(99) 8139-2210',
  endereco: 'Rua Leôncio Pires Dourado, nº 840-A, Bairro Bacuri, Imperatriz – MA, CEP 65.901-020',
  taxaMinimaFiscal: '0.5',
  aliquotaImposto: '35',
  aliquotaPIS: '1.65',
  aliquotaCOFINS: '7.6',
  aliquotaIRPJ: '15',
  aliquotaCSLL: '9',
  aliquotaISS: '5',
  aliquotaIOF: '0.38',
  c6BankAccessToken: '',
  c6BankPersonId: '',
  c6BankWebhookSecret: '',
  c6BankSandbox: 'true',
};

export default function ConfiguracoesPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle');
  const [erroMsg, setErroMsg] = useState('');

  useEffect(() => {
    fetch('/api/configuracoes').then(r => r.json()).then(d => {
      if (d) setForm({
        nomeEmpresa: d.nomeEmpresa ?? 'Efficaz Factoring',
        cnpj: d.cnpj ?? '04.578.232/0001-82',
        emailSistema: d.emailSistema ?? 'contato@grupoefficaz.com.br',
        telefone: d.telefone ?? '(99) 8139-2210',
        endereco: d.endereco ?? 'Rua Leôncio Pires Dourado, nº 840-A, Bairro Bacuri, Imperatriz – MA, CEP 65.901-020',
        taxaMinimaFiscal: String(d.taxaMinimaFiscal ?? 0.5),
        aliquotaImposto: String(d.aliquotaImposto ?? 35),
        aliquotaPIS: String(d.aliquotaPIS ?? 1.65),
        aliquotaCOFINS: String(d.aliquotaCOFINS ?? 7.6),
        aliquotaIRPJ: String(d.aliquotaIRPJ ?? 15),
        aliquotaCSLL: String(d.aliquotaCSLL ?? 9),
        aliquotaISS: String(d.aliquotaISS ?? 5),
        aliquotaIOF: String(d.aliquotaIOF ?? 0.38),
        c6BankAccessToken: d.c6BankAccessToken ?? '',
        c6BankPersonId: d.c6BankPersonId ?? '',
        c6BankWebhookSecret: d.c6BankWebhookSecret ?? '',
        c6BankSandbox: d.c6BankSandbox === false ? 'false' : 'true',
      });
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';

  const totalImpostos = [
    parseFloat(form.aliquotaPIS) || 0,
    parseFloat(form.aliquotaCOFINS) || 0,
    parseFloat(form.aliquotaIRPJ) || 0,
    parseFloat(form.aliquotaCSLL) || 0,
    parseFloat(form.aliquotaISS) || 0,
    parseFloat(form.aliquotaIOF) || 0,
  ].reduce((a, b) => a + b, 0);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setStatus('idle'); setErroMsg('');
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          aliquotaImposto: String(totalImpostos.toFixed(2)),
          c6BankSandbox: form.c6BankSandbox === 'true',
        }),
      });
      if (res.ok) {
        setStatus('ok');
      } else {
        const body = await res.json().catch(() => ({}));
        setErroMsg(`Erro ${res.status}: ${body?.error ?? 'desconhecido'}`);
        setStatus('erro');
      }
    } catch (err) {
      setErroMsg(err instanceof Error ? err.message : 'Erro de rede');
      setStatus('erro');
    }
    finally { setLoading(false); }
  };

  const c6Ativo = Boolean(form.c6BankAccessToken && form.c6BankPersonId);

  return (
    <div className="max-w-2xl space-y-5">
      <form onSubmit={salvar} className="space-y-5">
        {/* Empresa */}
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Telefone</label>
              <input className={inputCls} value={(form as any).telefone ?? ''} onChange={e => set('telefone', e.target.value)} placeholder="(99) 9999-9999" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail do Sistema</label>
              <input type="email" className={inputCls} value={form.emailSistema} onChange={e => set('emailSistema', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Endereço Completo</label>
              <input className={inputCls} value={(form as any).endereco ?? ''} onChange={e => set('endereco', e.target.value)} placeholder="Rua, nº, Bairro, Cidade – UF, CEP" />
            </div>
          </div>
        </div>

        {/* Motor Fiscal */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Motor Fiscal — Lucro Presumido</h2>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full border border-blue-100">
              Carga total: {totalImpostos.toFixed(2)}%
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Taxa Mínima Fiscal (% a.m.)</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.taxaMinimaFiscal} onChange={e => set('taxaMinimaFiscal', e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Usada no espelho fiscal para reduzir a base tributária.</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Impostos Individuais (Factoring — Fomento Mercantil)</p>
              <Info className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'aliquotaPIS', label: 'PIS (%)', hint: 'Padrão: 1,65%' },
                { key: 'aliquotaCOFINS', label: 'COFINS (%)', hint: 'Padrão: 7,60%' },
                { key: 'aliquotaIRPJ', label: 'IRPJ (%)', hint: 'Padrão: 15,00%' },
                { key: 'aliquotaCSLL', label: 'CSLL (%)', hint: 'Padrão: 9,00%' },
                { key: 'aliquotaISS', label: 'ISS (%)', hint: 'Máx. municipal: 5%' },
                { key: 'aliquotaIOF', label: 'IOF (%)', hint: 'Padrão: 0,38%' },
              ].map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    type="number" step="0.01" min="0" max="100"
                    className={inputCls}
                    value={(form as any)[key]}
                    onChange={e => set(key, e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-blue-700 font-medium">Carga tributária efetiva total</span>
              <span className="text-sm font-bold text-blue-700">{totalImpostos.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* C6 Bank */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> C6 Bank — Emissão de Boletos
            </h2>
            {c6Ativo ? (
              <span className="text-xs bg-green-50 text-green-700 font-semibold px-3 py-1 rounded-full border border-green-200">
                Ativo
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-3 py-1 rounded-full border border-gray-200">
                Não configurado
              </span>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            Acesse <span className="font-semibold">developers.c6bank.com.br</span> → Cadastro para obter o Access Token e Person ID. Após aprovação, cole as credenciais abaixo.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Access Token (Bearer)</label>
              <input
                type="password"
                className={inputCls}
                value={form.c6BankAccessToken}
                onChange={e => set('c6BankAccessToken', e.target.value)}
                placeholder="Token fornecido pelo C6 Bank"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Person ID</label>
              <input
                className={inputCls}
                value={form.c6BankPersonId}
                onChange={e => set('c6BankPersonId', e.target.value)}
                placeholder="ID numérico da conta"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Webhook Secret</label>
              <input
                type="password"
                className={inputCls}
                value={form.c6BankWebhookSecret}
                onChange={e => set('c6BankWebhookSecret', e.target.value)}
                placeholder="Para validar notificações de pagamento"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400 mt-0.5">URL do webhook: <span className="font-mono">/api/boletos/webhook</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('c6BankSandbox', form.c6BankSandbox === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.c6BankSandbox === 'true' ? 'bg-amber-400' : 'bg-blue-600'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.c6BankSandbox === 'true' ? 'translate-x-1' : 'translate-x-4'}`} />
            </button>
            <span className="text-xs text-gray-600 font-medium">
              {form.c6BankSandbox === 'true'
                ? 'Sandbox (testes) — boletos não são reais'
                : 'Produção — boletos oficiais para cobrança'}
            </span>
          </div>
        </div>

        {status === 'ok' && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" /> Configurações salvas com sucesso!
          </div>
        )}
        {status === 'erro' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" /> {erroMsg || 'Erro ao salvar. Tente novamente.'}
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

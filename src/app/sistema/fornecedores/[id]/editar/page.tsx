'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

export default function EditarFornecedorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '', cpfCnpj: '', email: '', telefone: '', capitalTotal: '', ativo: true,
  });

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';
  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`/api/fornecedores/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          nome: data.nome ?? '',
          cpfCnpj: data.cpfCnpj ?? '',
          email: data.email ?? '',
          telefone: data.telefone ?? '',
          capitalTotal: data.capitalTotal != null ? String(data.capitalTotal) : '',
          ativo: data.ativo ?? true,
        });
      })
      .catch(() => setErro('Erro ao carregar dados.'))
      .finally(() => setLoadingData(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/fornecedores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar.');
      router.push('/sistema/fornecedores');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro.');
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

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/sistema/fornecedores" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Editar Fornecedor de Capital</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nome / Razão Social *</label>
            <input className={inputCls} value={form.nome} onChange={e => set('nome', e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">CPF / CNPJ *</label>
            <input className={inputCls} value={form.cpfCnpj} onChange={e => set('cpfCnpj', e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Capital Total (R$)</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.capitalTotal} onChange={e => set('capitalTotal', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Telefone</label>
            <input className={inputCls} value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail *</label>
            <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="col-span-2 flex items-center gap-3 pt-3 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-600">Status</label>
            <button
              type="button"
              onClick={() => set('ativo', !form.ativo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.ativo ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.ativo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-600">{form.ativo ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <Link href="/sistema/fornecedores" className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

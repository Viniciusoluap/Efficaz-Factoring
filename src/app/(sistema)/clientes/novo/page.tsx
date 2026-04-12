'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '', cpfCnpj: '', email: '', telefone: '', endereco: '',
    senhaPortal: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErro('');
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar.');
      router.push('/sistema/clientes');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/sistema/clientes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-700">Dados do Cliente</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nome / Razão Social *</label>
            <input className={inputCls} value={form.nome} onChange={e => set('nome', e.target.value)} required placeholder="Nome completo ou razão social" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">CPF / CNPJ *</label>
            <input className={inputCls} value={form.cpfCnpj} onChange={e => set('cpfCnpj', e.target.value)} required placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Telefone</label>
            <input className={inputCls} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99000-0000" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail *</label>
            <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} required placeholder="cliente@email.com" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Endereço</label>
            <input className={inputCls} value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="col-span-2 pt-3 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Senha do Portal do Cliente</label>
            <input type="password" className={inputCls} value={form.senhaPortal} onChange={e => set('senhaPortal', e.target.value)} placeholder="Senha para acesso ao portal" />
            <p className="text-xs text-gray-400 mt-1">O cliente usará o e-mail acima para fazer login no portal.</p>
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
            <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar Cliente'}
          </button>
          <Link href="/sistema/clientes" className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

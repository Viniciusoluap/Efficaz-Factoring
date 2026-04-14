'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2, User, Lock, Image } from 'lucide-react';

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

export default function PortalConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    fetch('/api/portal/perfil')
      .then(r => r.json())
      .then(d => {
        setNome(d.nome ?? '');
        setEmail(d.email ?? '');
        setFotoUrl(d.fotoUrl ?? '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSalvarPerfil = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true); setErro(''); setSucesso('');
    try {
      const res = await fetch('/api/portal/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, fotoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar.');
      setSucesso('Perfil atualizado com sucesso!');
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally { setSalvando(false); }
  };

  const handleAlterarSenha = async (e: FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) { setErro('As senhas não coincidem.'); return; }
    if (novaSenha.length < 6) { setErro('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    setSalvando(true); setErro(''); setSucesso('');
    try {
      const res = await fetch('/api/portal/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao alterar senha.');
      setSucesso('Senha alterada com sucesso!');
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally { setSalvando(false); }
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Carregando...</div>;

  return (
    <div className="max-w-xl space-y-5">
      {/* Alertas globais */}
      {sucesso && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {sucesso}
        </div>
      )}
      {erro && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
        </div>
      )}

      {/* Foto de perfil preview */}
      {fotoUrl && (
        <div className="flex justify-center">
          <img src={fotoUrl} alt="Foto de perfil"
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
        </div>
      )}

      {/* Dados pessoais */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Dados Pessoais
        </h2>
        <form onSubmit={handleSalvarPerfil} className="space-y-4">
          <div>
            <label className={labelCls}>Nome completo</label>
            <input className={inputCls} value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>E-mail</label>
            <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Foto de perfil (URL da imagem)</label>
            <input type="url" className={inputCls} value={fotoUrl}
              onChange={e => setFotoUrl(e.target.value)}
              placeholder="https://exemplo.com/minha-foto.jpg" />
            <p className="text-xs text-gray-400 mt-1">Cole o link de uma imagem online. Formatos: JPG, PNG, WebP.</p>
          </div>
          <button type="submit" disabled={salvando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm text-sm">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {salvando ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" />
          Alterar Senha
        </h2>
        <form onSubmit={handleAlterarSenha} className="space-y-4">
          <div>
            <label className={labelCls}>Senha atual *</label>
            <input type="password" className={inputCls} value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Nova senha *</label>
            <input type="password" className={inputCls} value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className={labelCls}>Confirmar nova senha *</label>
            <input type="password" className={inputCls} value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)} required />
          </div>
          <button type="submit" disabled={salvando}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm text-sm">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {salvando ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

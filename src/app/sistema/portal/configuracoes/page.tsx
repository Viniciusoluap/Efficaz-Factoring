'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2, User, Lock, Camera } from 'lucide-react';

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

export default function PortalConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const fotoInputRef = useRef<HTMLInputElement>(null);

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

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadandoFoto(true);
    setErro('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pasta', 'fotos-perfil');

      const res = await fetch('/api/portal/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Erro ao fazer upload da foto.');
      const { url } = await res.json();

      // Salva automaticamente no perfil
      const saveRes = await fetch('/api/portal/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, fotoUrl: url }),
      });
      if (!saveRes.ok) throw new Error('Erro ao salvar foto.');

      setFotoUrl(url);
      setSucesso('Foto atualizada com sucesso!');
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao atualizar foto.');
    } finally {
      setUploadandoFoto(false);
      e.target.value = '';
    }
  };

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

      {/* Foto de perfil com upload */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFotoChange}
        />
        <button
          type="button"
          onClick={() => fotoInputRef.current?.click()}
          disabled={uploadandoFoto}
          className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md group focus:outline-none disabled:opacity-70"
        >
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <User className="w-10 h-10 text-blue-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploadandoFoto
              ? <Loader2 className="w-6 h-6 text-white animate-spin" />
              : <Camera className="w-6 h-6 text-white" />
            }
          </div>
        </button>

        {/* Badge câmera */}
        <button
          type="button"
          onClick={() => fotoInputRef.current?.click()}
          disabled={uploadandoFoto}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
        >
          {uploadandoFoto
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando foto...</>
            : <><Camera className="w-3.5 h-3.5" /> {fotoUrl ? 'Alterar foto' : 'Adicionar foto'}</>
          }
        </button>
        <p className="text-xs text-gray-400">Toque na foto ou no botão para tirar ou escolher uma imagem</p>
      </div>

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

'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { formatarMoeda } from '@/lib/calculos';
import { Send, Inbox, AlertCircle, CheckCircle2, Loader2, Clock, Paperclip, X, ImageIcon, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPOS = [
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'DUPLICATA', label: 'Duplicata' },
  { value: 'NOTA', label: 'Nota Fiscal' },
  { value: 'PROMISSORIA', label: 'Promissória' },
  { value: 'OUTRO', label: 'Outro' },
];

const statusInfo: Record<string, { label: string; cor: string }> = {
  AGUARDANDO:  { label: 'Aguardando', cor: 'bg-amber-100 text-amber-700' },
  EM_ANALISE:  { label: 'Em Análise', cor: 'bg-blue-100 text-blue-700' },
  APROVADA:    { label: 'Aprovada', cor: 'bg-green-100 text-green-700' },
  RECUSADA:    { label: 'Recusada', cor: 'bg-red-100 text-red-700' },
};

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

type Arquivo = {
  id: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  preview?: string;
};

function isImage(file: File) {
  return file.type.startsWith('image/');
}

export default function PortalSolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const [tipo, setTipo] = useState('CHEQUE');
  const [descricao, setDescricao] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const carregar = () => {
    fetch('/api/portal/solicitacoes')
      .then(r => r.json())
      .then(d => { setSolicitacoes(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const uploadArquivo = async (arq: Arquivo) => {
    const formData = new FormData();
    formData.append('file', arq.file);
    formData.append('pasta', 'solicitacoes');

    try {
      const res = await fetch('/api/portal/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Falha no upload');
      const { url } = await res.json();
      setArquivos(prev => prev.map(a => a.id === arq.id ? { ...a, status: 'done', url } : a));
    } catch {
      setArquivos(prev => prev.map(a => a.id === arq.id ? { ...a, status: 'error' } : a));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const novos: Arquivo[] = files.map(file => {
      const id = `${Date.now()}-${Math.random()}`;
      const preview = isImage(file) ? URL.createObjectURL(file) : undefined;
      return { id, file, status: 'uploading', preview };
    });

    setArquivos(prev => [...prev, ...novos]);
    novos.forEach(a => uploadArquivo(a));

    // reset input so same file can be re-added
    e.target.value = '';
  };

  const removerArquivo = (id: string) => {
    setArquivos(prev => {
      const arq = prev.find(a => a.id === id);
      if (arq?.preview) URL.revokeObjectURL(arq.preview);
      return prev.filter(a => a.id !== id);
    });
  };

  const excluirSolicitacao = async (id: string) => {
    await fetch(`/api/portal/solicitacoes/${id}`, { method: 'DELETE' });
    setSolicitacoes(prev => prev.filter((s: any) => s.id !== id));
    setConfirmDelete(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) { setErro('Descreva o que deseja antecipar.'); return; }

    const uploading = arquivos.filter(a => a.status === 'uploading');
    if (uploading.length > 0) {
      setErro('Aguarde o upload dos arquivos terminar.');
      return;
    }

    setEnviando(true); setErro('');
    try {
      const anexos = arquivos.filter(a => a.status === 'done' && a.url).map(a => a.url!);
      const res = await fetch('/api/portal/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, descricao, valorEstimado, anexos }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao enviar.');
      setSucesso(true);
      setDescricao(''); setValorEstimado(''); setTipo('CHEQUE');
      setArquivos([]);
      carregar();
      setTimeout(() => setSucesso(false), 4000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Formulário de nova solicitação */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600" />
          Nova Solicitação de Antecipação
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo de Documento *</label>
              <select className={inputCls} value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Valor Estimado (R$)</label>
              <input type="number" step="0.01" min="0" className={inputCls}
                value={valorEstimado} onChange={e => setValorEstimado(e.target.value)}
                placeholder="10000.00" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Descreva sua solicitação *</label>
            <textarea
              rows={4}
              className={`${inputCls} resize-none`}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva os documentos que deseja antecipar: quantidade, emitentes, vencimentos, valores aproximados."
            />
          </div>

          {/* Upload de arquivos */}
          <div>
            <label className={labelCls}>Fotos / Documentos</label>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 mb-3 leading-relaxed">
              <strong>Dica:</strong> Escaneie seus títulos ou tire fotos e adicione aqui. Você pode adicionar várias fotos. Formatos aceitos: JPG, PNG, HEIC, PDF.
            </div>

            {/* Thumbnails dos arquivos selecionados */}
            {arquivos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {arquivos.map(arq => (
                  <div key={arq.id} className="relative group">
                    {arq.preview ? (
                      <img src={arq.preview} alt={arq.file.name}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                    ) : (
                      <div className="w-20 h-20 flex flex-col items-center justify-center bg-gray-100 rounded-xl border border-gray-200 gap-1">
                        <FileText className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 truncate w-16 text-center px-1">
                          {arq.file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Overlay de status */}
                    {arq.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    {arq.status === 'error' && (
                      <div className="absolute inset-0 bg-red-500/70 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {arq.status === 'done' && (
                      <div className="absolute top-1 left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Botão remover */}
                    <button type="button"
                      onClick={() => removerArquivo(arq.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botão de adicionar arquivos */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors">
              <Paperclip className="w-4 h-4" />
              {arquivos.length === 0 ? 'Adicionar fotos ou documentos' : 'Adicionar mais arquivos'}
            </button>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
            </div>
          )}
          {sucesso && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Solicitação enviada com sucesso! Entraremos em contato em breve.
            </div>
          )}
          <button type="submit" disabled={enviando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm text-sm">
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {enviando ? 'Enviando...' : 'Enviar Solicitação'}
          </button>
        </form>
      </div>

      {/* Histórico de solicitações */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Inbox className="w-4 h-4 text-blue-600" />
          Minhas Solicitações
          <span className="ml-auto text-xs text-gray-400 font-normal">{solicitacoes.length} solicitação{solicitacoes.length !== 1 ? 'ões' : ''}</span>
        </h2>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Carregando...</p>
        ) : solicitacoes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nenhuma solicitação enviada ainda.</p>
        ) : (
          <div className="space-y-3">
            {solicitacoes.map((s: any) => {
              const st = statusInfo[s.status] ?? statusInfo.AGUARDANDO;
              return (
                <div key={s.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{TIPOS.find(t => t.value === s.tipo)?.label ?? s.tipo}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(s.criadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cor}`}>{st.label}</span>
                      {s.valorEstimado && (
                        <p className="text-xs text-blue-600 font-semibold mt-1">{formatarMoeda(Number(s.valorEstimado))}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{s.descricao}</p>

                  {/* Anexos */}
                  {s.anexos && s.anexos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.anexos.map((url: string, i: number) => {
                        const isPdf = url.toLowerCase().includes('.pdf');
                        return (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-1 rounded-lg transition-colors">
                            {isPdf ? <FileText className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                            Anexo {i + 1}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {s.observacaoAdmin && (
                    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                      <strong>Resposta:</strong> {s.observacaoAdmin}
                    </div>
                  )}

                  {s.status === 'AGUARDANDO' && (
                    <div className="mt-3 flex gap-1.5">
                      {confirmDelete === s.id ? (
                        <>
                          <button onClick={() => excluirSolicitacao(s.id)}
                            className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                            Confirmar exclusão
                          </button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg font-medium">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(s.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-red-100">
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

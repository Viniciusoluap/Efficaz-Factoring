'use client';

import { useState, useRef } from 'react';
import { Paperclip, Upload, Trash2, Loader2, ExternalLink, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Documento = {
  id: string;
  nome: string;
  url: string;
  criadoEm: string;
};

type Props = {
  operacaoId: string;
  initialDocs: Documento[];
};

export default function DocumentosOperacao({ operacaoId, initialDocs }: Props) {
  const [docs, setDocs] = useState<Documento[]>(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nome', file.name);

      const res = await fetch(`/api/operacoes/${operacaoId}/documentos`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Erro ao fazer upload.');
      }

      const novoDoc = await res.json();
      setDocs(prev => [novoDoc, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    setError(null);
    try {
      const res = await fetch(`/api/operacoes/${operacaoId}/documentos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      });
      if (!res.ok) throw new Error('Erro ao remover documento.');
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.');
    } finally {
      setDeletingId(null);
    }
  };

  const ext = (nome: string) => nome.split('.').pop()?.toLowerCase() ?? '';
  const extIcon = (nome: string) => {
    const e = ext(nome);
    if (e === 'pdf') return 'text-red-500';
    if (['jpg', 'jpeg', 'png'].includes(e)) return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-700 text-sm">Documentos Assinados</h3>
          {docs.length > 0 && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {docs.length}
            </span>
          )}
        </div>
        <label className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
          uploading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
        }`}>
          {uploading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Enviando...' : 'Adicionar Documento'}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-3">
          {error}
        </p>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhum documento assinado ainda.</p>
          <p className="text-xs text-gray-300 mt-0.5">
            Adicione contratos, notas ou outros documentos assinados da operação.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 transition-colors group"
            >
              <FileText className={`w-5 h-5 shrink-0 ${extIcon(doc.nome)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{doc.nome}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(doc.criadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Abrir documento"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  title="Remover documento"
                >
                  {deletingId === doc.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, FormEvent } from 'react';
import { formatarMoeda } from '@/lib/calculos';
import { Send, Inbox, AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';
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

export default function PortalSolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const [tipo, setTipo] = useState('CHEQUE');
  const [descricao, setDescricao] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');

  const carregar = () => {
    fetch('/api/portal/solicitacoes')
      .then(r => r.json())
      .then(d => { setSolicitacoes(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) { setErro('Descreva o que deseja antecipar.'); return; }
    setEnviando(true); setErro('');
    try {
      const res = await fetch('/api/portal/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, descricao, valorEstimado }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao enviar.');
      setSucesso(true);
      setDescricao(''); setValorEstimado(''); setTipo('CHEQUE');
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
              placeholder="Descreva os documentos que deseja antecipar: quantidade, emitentes, vencimentos, valores aproximados. Nossa equipe entrará em contato para orientar o envio dos arquivos."
            />
          </div>
          <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            Após o envio, nossa equipe analisará sua solicitação e entrará em contato via WhatsApp ou e-mail para solicitar as imagens/documentos e prosseguir com a antecipação.
          </p>
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
                  {s.observacaoAdmin && (
                    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                      <strong>Resposta:</strong> {s.observacaoAdmin}
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

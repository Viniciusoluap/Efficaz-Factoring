'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, X, Loader2 } from 'lucide-react';
import { formatarMoeda } from '@/lib/calculos';

type Props = {
  tituloId: string;
  valorAtual: number;
};

export default function PagamentoParcialBtn({ tituloId, valorAtual }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [valorPagamento, setValorPagamento] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const pgto = parseFloat(valorPagamento) || 0;
  const novoValor = pgto > 0 && pgto < valorAtual ? Math.round((valorAtual - pgto) * 100) / 100 : null;

  const handleConfirmar = async () => {
    if (!valorPagamento || pgto <= 0) { setErro('Informe um valor válido.'); return; }
    if (pgto >= valorAtual) { setErro('O pagamento parcial deve ser menor que o valor total.'); return; }
    setLoading(true); setErro('');
    try {
      const res = await fetch(`/api/titulos/${tituloId}/pagamento-parcial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valorPagamento: pgto }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao registrar.');
      setAberto(false);
      setValorPagamento('');
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro.');
    } finally { setLoading(false); }
  };

  const handleFechar = () => { setAberto(false); setValorPagamento(''); setErro(''); };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-sm"
      >
        <Banknote className="w-3.5 h-3.5" />
        Pgto Parcial
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Pagamento Parcial</h3>
              <button onClick={handleFechar} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <p><span className="font-medium">Valor atual do título:</span> {formatarMoeda(valorAtual)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Valor do Pagamento Parcial (R$) *</label>
                <input
                  type="number" step="0.01" min="0.01"
                  className={inputCls}
                  value={valorPagamento}
                  onChange={e => setValorPagamento(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              {novoValor !== null && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-teal-700 font-medium">Novo valor do título</span>
                  <span className="text-sm font-bold text-teal-800">{formatarMoeda(novoValor)}</span>
                </div>
              )}

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{erro}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={handleConfirmar} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                  {loading ? 'Processando...' : 'Confirmar'}
                </button>
                <button onClick={handleFechar} className="px-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';

export default function OperacaoStatusBtn({
  operacaoId,
  statusAtual,
}: {
  operacaoId: string;
  statusAtual: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isPaga = statusAtual === 'PAGA';

  const toggle = async () => {
    setLoading(true);
    const novoStatus = isPaga ? 'PENDENTE' : 'PAGA';
    await fetch(`/api/operacoes/${operacaoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-colors disabled:opacity-60 ${
        isPaga
          ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'
      }`}
      title={isPaga ? 'Clique para marcar como Pendente' : 'Clique para marcar como Paga'}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPaga ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : (
        <Clock className="w-3.5 h-3.5" />
      )}
      {isPaga ? 'Paga' : 'Pendente'}
    </button>
  );
}

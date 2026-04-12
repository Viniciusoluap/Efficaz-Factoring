'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const statusOpcoes = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'LIQUIDADO', label: 'Liquidado' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'PROTESTADO', label: 'Protestado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function AlterarStatusBtn({
  tituloId,
  statusAtual,
}: {
  tituloId: string;
  statusAtual: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const alterar = async (novoStatus: string) => {
    if (novoStatus === statusAtual) return;
    setLoading(true);
    await fetch(`/api/titulos/${tituloId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="mt-3 relative">
      <select
        value={statusAtual}
        onChange={(e) => alterar(e.target.value)}
        disabled={loading}
        className="appearance-none bg-white/10 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg pr-7 cursor-pointer hover:bg-white/20 transition-colors disabled:opacity-60"
      >
        {statusOpcoes.map((s) => (
          <option key={s.value} value={s.value} className="text-gray-800 bg-white">
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none" />
    </div>
  );
}

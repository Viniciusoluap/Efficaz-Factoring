'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function FornecedorAcoes({ id }: { id: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);

  const excluir = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fornecedores/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert('Erro ao excluir fornecedor.');
    } finally {
      setLoading(false);
      setConfirmando(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/sistema/fornecedores/${id}/editar`}
        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="Editar"
      >
        <Pencil className="w-3.5 h-3.5" />
      </Link>

      {confirmando ? (
        <div className="flex items-center gap-1">
          <button
            onClick={excluir}
            disabled={loading}
            className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 font-medium"
          >
            {loading ? '...' : 'Confirmar'}
          </button>
          <button
            onClick={() => setConfirmando(false)}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmando(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

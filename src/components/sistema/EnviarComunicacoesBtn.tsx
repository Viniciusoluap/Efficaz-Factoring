'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';

export default function EnviarComunicacoesBtn({
  tituloIds,
  gatilho,
  label = 'Enviar notificações',
}: {
  tituloIds: string[];
  gatilho: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  const enviar = async () => {
    setLoading(true);
    try {
      await fetch('/api/comunicacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tituloIds, gatilho }),
      });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={enviar}
      disabled={loading || ok || tituloIds.length === 0}
      className="flex items-center gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
       ok ? <CheckCircle className="w-3.5 h-3.5" /> :
       <Send className="w-3.5 h-3.5" />}
      {ok ? 'Enviado!' : label}
    </button>
  );
}

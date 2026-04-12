'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

export default function ExportarTitulosBtn() {
  const [loading, setLoading] = useState(false);

  const exportar = async () => {
    setLoading(true);
    try {
      const { exportarTitulosListaXLS } = await import('@/lib/xls');
      const res = await fetch('/api/titulos');
      const titulos = await res.json();
      exportarTitulosListaXLS(
        titulos.map((t: any) => ({
          numero: t.numero,
          tipo: t.tipo,
          status: t.status,
          emitenteNome: t.emitenteNome,
          emitenteCpfCnpj: t.emitenteCpfCnpj,
          sacadoNome: t.sacadoNome,
          sacadoCpfCnpj: t.sacadoCpfCnpj,
          dataEmissao: new Date(t.dataEmissao).toLocaleDateString('pt-BR'),
          dataVencimento: new Date(t.dataVencimento).toLocaleDateString('pt-BR'),
          prazo: t.prazo,
          valor: Number(t.valor),
          taxaCliente: Number(t.taxaCliente),
          taxaFornecedor: Number(t.taxaFornecedor),
          encargo: Number(t.encargo),
          valorLiquidoCliente: Number(t.valorLiquidoCliente),
          custoCedente: Number(t.custoCedente),
          spreadBruto: Number(t.spreadBruto),
          spreadLiquido: Number(t.spreadLiquido ?? 0),
          impostoProvisao: Number(t.impostoProvisao ?? 0),
          clienteNome: t.cliente?.nome,
          fornecedorNome: t.fornecedor?.nome,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exportar}
      disabled={loading}
      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      Exportar XLS
    </button>
  );
}

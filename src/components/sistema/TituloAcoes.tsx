'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { gerarContratoPDF } from '@/lib/pdf';
import { exportarTituloXLS } from '@/lib/xls';

type DadosTitulo = {
  id: string;
  numero: string;
  tipo: string;
  status: string;
  emitenteNome: string;
  emitenteCpfCnpj: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  dataEmissao: string;
  dataVencimento: string;
  prazo: number;
  valor: number;
  taxaCliente: number;
  taxaFornecedor: number;
  encargo: number;
  valorLiquidoCliente: number;
  custoCedente: number;
  spreadBruto: number;
  spreadLiquido: number;
  impostoProvisao: number;
  clienteNome?: string;
  fornecedorNome?: string;
  observacoes?: string | null;
  criadoEm: string;
};

export default function TituloAcoes({ dados }: { dados: DadosTitulo }) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingXls, setLoadingXls] = useState(false);

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      await gerarContratoPDF(dados);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleXls = () => {
    setLoadingXls(true);
    try {
      exportarTituloXLS([dados]);
    } finally {
      setLoadingXls(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePdf}
        disabled={loadingPdf}
        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
      >
        {loadingPdf ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        Contrato PDF
      </button>

      <button
        onClick={handleXls}
        disabled={loadingXls}
        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
      >
        {loadingXls ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        Exportar XLS
      </button>
    </div>
  );
}

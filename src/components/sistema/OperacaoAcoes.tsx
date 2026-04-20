'use client';

import { useState } from 'react';
import { FileText, FileSpreadsheet, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { gerarContratoOperacaoPDF, gerarContratoFornecedorPDF, OperacaoPDF, TituloOperacaoPDF, TituloFornecedorPDF } from '@/lib/pdf';
import { exportarTituloXLS } from '@/lib/xls';

type TituloXLS = {
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
};

type Props = {
  operacao: OperacaoPDF;
  titulosPDF: TituloOperacaoPDF[];
  titulosFornecedor: TituloFornecedorPDF[];
  titulosXLS: TituloXLS[];
  operacaoId: string;
};

export default function OperacaoAcoes({ operacao, titulosPDF, titulosFornecedor, titulosXLS, operacaoId }: Props) {
  const router = useRouter();
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingPdfForn, setLoadingPdfForn] = useState(false);
  const [loadingXls, setLoadingXls] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [loadingDel, setLoadingDel] = useState(false);

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      const cfg = await fetch('/api/configuracoes').then(r => r.json()).catch(() => null);
      await gerarContratoOperacaoPDF(operacao, titulosPDF, cfg ?? undefined);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handlePdfFornecedor = async () => {
    setLoadingPdfForn(true);
    try {
      const cfg = await fetch('/api/configuracoes').then(r => r.json()).catch(() => null);
      await gerarContratoFornecedorPDF(operacao, titulosFornecedor, cfg ?? undefined);
    } finally {
      setLoadingPdfForn(false);
    }
  };

  const handleXls = () => {
    setLoadingXls(true);
    try {
      exportarTituloXLS(titulosXLS, `operacao-${operacao.numero}`);
    } finally {
      setLoadingXls(false);
    }
  };

  const excluirOperacao = async () => {
    setLoadingDel(true);
    const res = await fetch(`/api/operacoes/${operacaoId}`, { method: 'DELETE' });
    setLoadingDel(false);
    if (res.ok) {
      router.push('/sistema/titulos');
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handlePdf}
        disabled={loadingPdf}
        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
      >
        {loadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
        Contrato PDF
      </button>

      {titulosFornecedor.length > 0 && operacao.fornecedorNome && (
        <button
          onClick={handlePdfFornecedor}
          disabled={loadingPdfForn}
          className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
        >
          {loadingPdfForn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          Contrato Fornecedor
        </button>
      )}

      <button
        onClick={handleXls}
        disabled={loadingXls}
        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
      >
        {loadingXls ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
        Exportar XLS
      </button>

      {confirmando ? (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-xs text-red-600 font-medium">Excluir operação?</span>
          <button
            onClick={excluirOperacao}
            disabled={loadingDel}
            className="inline-flex items-center gap-1 text-xs text-white bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded-lg font-semibold disabled:opacity-60"
          >
            {loadingDel && <Loader2 className="w-3 h-3 animate-spin" />}
            Excluir
          </button>
          <button
            onClick={() => setConfirmando(false)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg font-medium"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmando(true)}
          className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir Operação
        </button>
      )}
    </div>
  );
}

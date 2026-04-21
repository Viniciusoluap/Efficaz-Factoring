'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import ProrrogarBtn from './ProrrogarBtn';
import PagamentoParcialBtn from './PagamentoParcialBtn';

type Props = {
  tituloId: string;
  tituloNumero: string;
  tituloTipo: string;
  valor: number;
  taxaClienteAtual: number;
  taxaFornecedorAtual: number;
  dataVencimentoAtual: string;
  dataVencimentoISO: string;
  emitenteNome: string;
  emitenteCpfCnpj: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  status: string;
  clienteNome?: string;
  clienteRepresentanteNome?: string;
  clienteRepresentanteCpf?: string;
};

export default function TituloNaOperacaoAcoes({
  tituloId,
  tituloNumero,
  tituloTipo,
  valor,
  taxaClienteAtual,
  taxaFornecedorAtual,
  dataVencimentoAtual,
  dataVencimentoISO,
  emitenteNome,
  emitenteCpfCnpj,
  sacadoNome,
  sacadoCpfCnpj,
  status,
  clienteNome,
  clienteRepresentanteNome,
  clienteRepresentanteCpf,
}: Props) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);

  const excluir = async () => {
    setLoading(true);
    await fetch(`/api/titulos/${tituloId}`, { method: 'DELETE' });
    setLoading(false);
    setConfirmando(false);
    router.refresh();
  };

  const podeOperar = status === 'APROVADO' || status === 'PENDENTE' || status === 'VENCIDO';

  if (confirmando) {
    return (
      <div className="flex items-center gap-1 whitespace-nowrap">
        <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
        <button
          onClick={excluir}
          disabled={loading}
          className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg font-semibold disabled:opacity-60 inline-flex items-center gap-1"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Excluir
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg font-medium"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {podeOperar && (
        <>
          <ProrrogarBtn
            tituloId={tituloId}
            tituloNumero={tituloNumero}
            tituloTipo={tituloTipo}
            valor={valor}
            taxaClienteAtual={taxaClienteAtual}
            taxaFornecedorAtual={taxaFornecedorAtual}
            dataVencimentoAtual={dataVencimentoAtual}
            dataVencimentoISO={dataVencimentoISO}
            emitenteNome={emitenteNome}
            emitenteCpfCnpj={emitenteCpfCnpj}
            sacadoNome={sacadoNome}
            sacadoCpfCnpj={sacadoCpfCnpj}
            clienteNome={clienteNome}
            clienteRepresentanteNome={clienteRepresentanteNome}
            clienteRepresentanteCpf={clienteRepresentanteCpf}
          />
          <PagamentoParcialBtn tituloId={tituloId} valorAtual={valor} />
        </>
      )}
      <Link
        href={`/sistema/titulos/${tituloId}/editar`}
        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="Editar título"
      >
        <Pencil className="w-3.5 h-3.5" />
      </Link>
      <button
        onClick={() => setConfirmando(true)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Excluir título"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

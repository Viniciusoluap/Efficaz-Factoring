import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import OperacaoStatusBtn from '@/components/sistema/OperacaoStatusBtn';
import OperacaoAcoes from '@/components/sistema/OperacaoAcoes';
import TitulosSelecionaveis, { TituloTabela } from '@/components/sistema/TitulosSelecionaveis';


export default async function OperacaoDetalhePage({ params }: { params: { id: string } }) {
  const operacao = await prisma.operacao.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      fornecedor: true,
      titulos: { orderBy: [{ dataVencimento: 'asc' }, { valor: 'asc' }] },
    },
  });

  if (!operacao) notFound();

  const totais = operacao.titulos.reduce(
    (acc, t) => ({
      valor: acc.valor + Number(t.valor),
      encargo: acc.encargo + Number(t.encargo),
      liquidoCliente: acc.liquidoCliente + Number(t.valorLiquidoCliente),
      spreadBruto: acc.spreadBruto + Number(t.spreadBruto),
      spreadLiquido: acc.spreadLiquido + Number(t.spreadLiquido ?? 0),
      imposto: acc.imposto + Number(t.impostoProvisao ?? 0),
    }),
    { valor: 0, encargo: 0, liquidoCliente: 0, spreadBruto: 0, spreadLiquido: 0, imposto: 0 }
  );

  const isPaga = operacao.status === 'PAGA';
  const opStatusLabel = isPaga ? 'Paga' : 'Pendente';
  const opStatusCls = isPaga
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  // Serialise data for client components
  const operacaoPDF = {
    numero: operacao.numero,
    taxaCliente: Number(operacao.taxaCliente),
    taxaFornecedor: Number(operacao.taxaFornecedor),
    clienteNome: operacao.cliente?.nome,
    clienteCpfCnpj: operacao.cliente?.cpfCnpj,
    clienteEmail: operacao.cliente?.email,
    clienteTelefone: operacao.cliente?.telefone ?? undefined,
    clienteEndereco: operacao.cliente?.endereco ?? undefined,
    clienteRepresentanteNome: operacao.cliente?.representanteNome ?? undefined,
    clienteRepresentanteCpf: operacao.cliente?.representanteCpf ?? undefined,
    fornecedorNome: operacao.fornecedor?.nome,
    fornecedorCpfCnpj: operacao.fornecedor?.cpfCnpj,
    fornecedorEmail: operacao.fornecedor?.email,
    fornecedorTelefone: operacao.fornecedor?.telefone ?? undefined,
    criadoEm: format(new Date(operacao.criadoEm), "dd/MM/yyyy 'às' HH:mm"),
  };

  const titulosFornecedor = operacao.titulos.map(t => ({
    numero: t.numero,
    tipo: t.tipo,
    sacadoNome: t.sacadoNome,
    sacadoCpfCnpj: t.sacadoCpfCnpj,
    dataVencimento: format(new Date(t.dataVencimento), 'dd/MM/yyyy'),
    prazo: t.prazo,
    valor: Number(t.valor),
    custoCedente: Number(t.custoCedente),
  }));

  const titulosTabela: TituloTabela[] = operacao.titulos.map(t => ({
    id: t.id,
    numero: t.numero,
    tipo: t.tipo,
    status: t.status,
    sacadoNome: t.sacadoNome,
    sacadoCpfCnpj: t.sacadoCpfCnpj,
    emitenteNome: t.emitenteNome,
    emitenteCpfCnpj: t.emitenteCpfCnpj,
    dataVencimento: format(new Date(t.dataVencimento), 'dd/MM/yyyy'),
    dataEmissao: format(new Date(t.dataEmissao), 'dd/MM/yyyy'),
    prazo: t.prazo,
    valor: Number(t.valor),
    encargo: Number(t.encargo),
    valorLiquidoCliente: Number(t.valorLiquidoCliente),
    spreadBruto: Number(t.spreadBruto),
  }));

  const titulosPDF = operacao.titulos.map(t => ({
    numero: t.numero,
    tipo: t.tipo,
    emitenteNome: t.emitenteNome,
    emitenteCpfCnpj: t.emitenteCpfCnpj,
    sacadoNome: t.sacadoNome,
    sacadoCpfCnpj: t.sacadoCpfCnpj,
    dataEmissao: format(new Date(t.dataEmissao), 'dd/MM/yyyy'),
    dataVencimento: format(new Date(t.dataVencimento), 'dd/MM/yyyy'),
    prazo: t.prazo,
    valor: Number(t.valor),
    taxaCliente: Number(t.taxaCliente),
    encargo: Number(t.encargo),
    valorLiquidoCliente: Number(t.valorLiquidoCliente),
  }));

  const titulosXLS = operacao.titulos.map(t => ({
    numero: t.numero,
    tipo: t.tipo,
    status: t.status,
    emitenteNome: t.emitenteNome,
    emitenteCpfCnpj: t.emitenteCpfCnpj,
    sacadoNome: t.sacadoNome,
    sacadoCpfCnpj: t.sacadoCpfCnpj,
    dataEmissao: format(new Date(t.dataEmissao), 'dd/MM/yyyy'),
    dataVencimento: format(new Date(t.dataVencimento), 'dd/MM/yyyy'),
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
    clienteNome: operacao.cliente?.nome,
    fornecedorNome: operacao.fornecedor?.nome,
  }));

  return (
    <div className="w-full space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/sistema/titulos" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Voltar para Operações
        </Link>
        <OperacaoAcoes
          operacao={operacaoPDF}
          titulosPDF={titulosPDF}
          titulosFornecedor={titulosFornecedor}
          titulosXLS={titulosXLS}
          operacaoId={operacao.id}
        />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Operação
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${opStatusCls}`}>
                {opStatusLabel}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{operacao.numero}</h1>
            <p className="text-white/50 text-sm mt-1">
              Criada em {format(new Date(operacao.criadoEm), 'dd/MM/yyyy')} · {operacao.titulos.length} título{operacao.titulos.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-3">
              <OperacaoStatusBtn operacaoId={operacao.id} statusAtual={operacao.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-400">{formatarMoeda(totais.valor)}</p>
            <p className="text-white/50 text-sm">Volume total</p>
          </div>
        </div>

        {/* Info rápida */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
          {[
            { label: 'Taxa Cliente', value: `${Number(operacao.taxaCliente).toFixed(2)}% a.m.` },
            { label: 'Taxa Fornecedor', value: `${Number(operacao.taxaFornecedor).toFixed(2)}% a.m.` },
            { label: 'Cliente', value: operacao.cliente?.nome ?? '—' },
            { label: 'Fornecedor', value: operacao.fornecedor?.nome ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-white/40 text-xs mb-0.5">{label}</p>
              <p className="text-white text-sm font-medium truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Volume Bruto', value: formatarMoeda(totais.valor), cor: 'text-gray-800' },
          { label: 'Total Encargos', value: formatarMoeda(totais.encargo), cor: 'text-amber-600' },
          { label: 'Líquido Cliente', value: formatarMoeda(totais.liquidoCliente), cor: 'text-blue-600' },
          { label: 'Spread Bruto', value: formatarMoeda(totais.spreadBruto), cor: 'text-purple-600' },
          { label: 'Imposto', value: formatarMoeda(totais.imposto), cor: 'text-red-500' },
          { label: 'Spread Líquido', value: formatarMoeda(totais.spreadLiquido), cor: 'text-green-600' },
        ].map(({ label, value, cor }) => (
          <div key={label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className={`text-sm font-bold ${cor}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabela de títulos com seleção */}
      <TitulosSelecionaveis
        titulos={titulosTabela}
        totais={totais}
        operacaoId={operacao.id}
        operacaoNumero={operacao.numero}
        clienteNome={operacao.cliente?.nome}
        clienteCpfCnpj={operacao.cliente?.cpfCnpj}
      />

      {operacao.observacoes && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Observações da Operação</p>
          <p className="text-sm text-amber-800">{operacao.observacoes}</p>
        </div>
      )}
    </div>
  );
}

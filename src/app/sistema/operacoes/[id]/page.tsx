import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { TituloStatus, TituloTipo } from '@prisma/client';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Layers, Plus } from 'lucide-react';
import OperacaoStatusBtn from '@/components/sistema/OperacaoStatusBtn';
import OperacaoAcoes from '@/components/sistema/OperacaoAcoes';
import TituloNaOperacaoAcoes from '@/components/sistema/TituloNaOperacaoAcoes';
import AlterarStatusBtn from '@/components/sistema/AlterarStatusBtn';

const statusLabel: Record<TituloStatus, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Pago', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
};
const statusCor: Record<TituloStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  APROVADO: 'bg-green-100 text-green-700 border-green-200',
  VENCIDO: 'bg-red-100 text-red-700 border-red-200',
  LIQUIDADO: 'bg-blue-100 text-blue-700 border-blue-200',
  PROTESTADO: 'bg-purple-100 text-purple-700 border-purple-200',
  CANCELADO: 'bg-gray-100 text-gray-500 border-gray-200',
};
const tipoLabel: Record<TituloTipo, string> = {
  CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória',
};
const tipoCor: Record<TituloTipo, string> = {
  CHEQUE: 'bg-indigo-50 text-indigo-600',
  BOLETO: 'bg-cyan-50 text-cyan-600',
  PROMISSORIA: 'bg-rose-50 text-rose-600',
};

export default async function OperacaoDetalhePage({ params }: { params: { id: string } }) {
  const operacao = await prisma.operacao.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      fornecedor: true,
      titulos: { orderBy: { criadoEm: 'asc' } },
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
    fornecedorNome: operacao.fornecedor?.nome,
    criadoEm: format(new Date(operacao.criadoEm), "dd/MM/yyyy 'às' HH:mm"),
  };

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
          { label: 'Imposto Prov.', value: formatarMoeda(totais.imposto), cor: 'text-red-500' },
          { label: 'Spread Líquido', value: formatarMoeda(totais.spreadLiquido), cor: 'text-green-600' },
        ].map(({ label, value, cor }) => (
          <div key={label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className={`text-sm font-bold ${cor}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabela de títulos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-700 text-sm">Títulos desta Operação</h3>
          </div>
          <Link
            href="/sistema/titulos/novo"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Título
          </Link>
        </div>

        {operacao.titulos.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum título nesta operação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Tipo', 'Número', 'Sacado', 'Vencimento', 'Valor', 'Encargo', 'Líquido', 'Spread', 'Status', ''].map(h => (
                    <th key={h} className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {operacao.titulos.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-2 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-lg font-medium ${tipoCor[t.tipo]}`}>
                        {tipoLabel[t.tipo]}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-600 whitespace-nowrap">{t.numero}</td>
                    <td className="px-2 py-2 max-w-[140px]">
                      <p className="font-medium text-gray-700 text-xs truncate">{t.sacadoNome}</p>
                      <p className="text-gray-400 text-xs truncate">{t.sacadoCpfCnpj}</p>
                    </td>
                    <td className="px-2 py-2 text-gray-600 text-xs whitespace-nowrap">
                      {format(new Date(t.dataVencimento), 'dd/MM/yyyy')}
                      <p className="text-gray-400">{t.prazo}d</p>
                    </td>
                    <td className="px-2 py-2 font-semibold text-gray-800 text-xs whitespace-nowrap">
                      {formatarMoeda(Number(t.valor))}
                    </td>
                    <td className="px-2 py-2 text-amber-600 font-medium text-xs whitespace-nowrap">
                      {formatarMoeda(Number(t.encargo))}
                    </td>
                    <td className="px-2 py-2 text-blue-600 font-medium text-xs whitespace-nowrap">
                      {formatarMoeda(Number(t.valorLiquidoCliente))}
                    </td>
                    <td className="px-2 py-2 text-green-600 font-medium text-xs whitespace-nowrap">
                      {formatarMoeda(Number(t.spreadBruto))}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${statusCor[t.status]}`}>
                        {statusLabel[t.status]}
                      </span>
                      <div className="mt-1">
                        <AlterarStatusBtn tituloId={t.id} statusAtual={t.status} />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <TituloNaOperacaoAcoes tituloId={t.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="px-2 py-2 text-xs text-gray-500 uppercase tracking-wide">Total</td>
                  <td className="px-2 py-2 text-xs text-gray-800 font-bold whitespace-nowrap">{formatarMoeda(totais.valor)}</td>
                  <td className="px-2 py-2 text-xs text-amber-600 font-bold whitespace-nowrap">{formatarMoeda(totais.encargo)}</td>
                  <td className="px-2 py-2 text-xs text-blue-600 font-bold whitespace-nowrap">{formatarMoeda(totais.liquidoCliente)}</td>
                  <td className="px-2 py-2 text-xs text-green-600 font-bold whitespace-nowrap">{formatarMoeda(totais.spreadBruto)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {operacao.observacoes && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Observações da Operação</p>
          <p className="text-sm text-amber-800">{operacao.observacoes}</p>
        </div>
      )}
    </div>
  );
}

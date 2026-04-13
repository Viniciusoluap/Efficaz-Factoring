import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { TituloStatus, TituloTipo } from '@prisma/client';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Layers } from 'lucide-react';

const statusLabel: Record<TituloStatus, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Liquidado', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
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

function opStatusInfo(status: string) {
  if (status === 'CONCLUIDA') return { label: 'Concluída', cls: 'bg-green-100 text-green-700 border-green-200' };
  if (status === 'CANCELADA') return { label: 'Cancelada', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return { label: 'Aberta', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
}

export default async function OperacaoDetalhePage({ params }: { params: { id: string } }) {
  const operacao = await prisma.operacao.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      fornecedor: true,
      titulos: {
        orderBy: { criadoEm: 'asc' },
      },
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

  const { label: sLabel, cls: sCls } = opStatusInfo(operacao.status);

  return (
    <div className="max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <Link href="/sistema/titulos" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Voltar para Operações
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Operação
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${sCls}`}>
                {sLabel}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{operacao.numero}</h1>
            <p className="text-white/50 text-sm mt-1">
              Criada em {format(new Date(operacao.criadoEm), 'dd/MM/yyyy')} · {operacao.titulos.length} título{operacao.titulos.length !== 1 ? 's' : ''}
            </p>
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
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-700 text-sm">Títulos desta Operação</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {['Tipo', 'Número', 'Emissor', 'Vencimento', 'Valor', 'Encargo', 'Líquido', 'Spread', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {operacao.titulos.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${tipoCor[t.tipo]}`}>
                      {tipoLabel[t.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.numero}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 text-xs">{t.emitenteNome}</p>
                    <p className="text-gray-400 text-xs">{t.emitenteCpfCnpj}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {format(new Date(t.dataVencimento), 'dd/MM/yyyy')}
                    <p className="text-gray-400">{t.prazo}d</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800 text-xs">
                    {formatarMoeda(Number(t.valor))}
                  </td>
                  <td className="px-4 py-3 text-amber-600 font-medium text-xs">
                    {formatarMoeda(Number(t.encargo))}
                  </td>
                  <td className="px-4 py-3 text-blue-600 font-medium text-xs">
                    {formatarMoeda(Number(t.valorLiquidoCliente))}
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium text-xs">
                    {formatarMoeda(Number(t.spreadBruto))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusCor[t.status]}`}>
                      {statusLabel[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/sistema/titulos/${t.id}`}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totais da tabela */}
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Total</td>
                <td className="px-4 py-3 text-xs text-gray-800 font-bold">{formatarMoeda(totais.valor)}</td>
                <td className="px-4 py-3 text-xs text-amber-600 font-bold">{formatarMoeda(totais.encargo)}</td>
                <td className="px-4 py-3 text-xs text-blue-600 font-bold">{formatarMoeda(totais.liquidoCliente)}</td>
                <td className="px-4 py-3 text-xs text-green-600 font-bold">{formatarMoeda(totais.spreadBruto)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
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

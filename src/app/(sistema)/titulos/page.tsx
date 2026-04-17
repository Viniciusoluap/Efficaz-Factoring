import { prisma } from '@/lib/prisma';
import { formatarMoeda, formatarCpfCnpj } from '@/lib/calculos';
import { TituloStatus, TituloTipo } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Plus, FileText, Filter } from 'lucide-react';
import ExportarTitulosBtn from '@/components/sistema/ExportarTitulosBtn';

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
  CHEQUE: 'bg-indigo-50 text-indigo-600', BOLETO: 'bg-cyan-50 text-cyan-600',
  PROMISSORIA: 'bg-rose-50 text-rose-600',
};

export default async function TitulosPage() {
  const titulos = await prisma.titulo.findMany({
    orderBy: { criadoEm: 'desc' },
    include: { cliente: true, fornecedor: true },
  });

  const totais = titulos.reduce(
    (acc, t) => ({
      valor: acc.valor + Number(t.valor),
      encargo: acc.encargo + Number(t.encargo),
      spread: acc.spread + Number(t.spreadBruto),
    }),
    { valor: 0, encargo: 0, spread: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{titulos.length} título(s) cadastrado(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportarTitulosBtn />
          <Link
            href="/sistema/titulos/novo"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Título
          </Link>
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Volume Total', value: formatarMoeda(totais.valor), cor: 'text-blue-600' },
          { label: 'Total de Encargos', value: formatarMoeda(totais.encargo), cor: 'text-amber-600' },
          { label: 'Spread Bruto Total', value: formatarMoeda(totais.spread), cor: 'text-green-600' },
        ].map(({ label, value, cor }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${cor}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Todos os Títulos
          </h3>
        </div>

        {titulos.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum título cadastrado.</p>
            <Link href="/sistema/titulos/novo" className="inline-flex items-center gap-1 text-blue-600 text-sm mt-2 hover:underline">
              <Plus className="w-3 h-3" /> Cadastrar o primeiro título
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Tipo', 'Número', 'Emissor', 'Vencimento', 'Valor', 'Encargo', 'Spread', 'Taxa', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {titulos.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${tipoCor[t.tipo]}`}>
                        {tipoLabel[t.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.numero}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700 text-xs">{t.emitenteNome}</p>
                      <p className="text-gray-400 text-xs">{formatarCpfCnpj(t.emitenteCpfCnpj)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {format(new Date(t.dataVencimento), 'dd/MM/yyyy')}
                      <p className="text-gray-400">{t.prazo}d</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 text-xs">{formatarMoeda(Number(t.valor))}</td>
                    <td className="px-4 py-3 text-amber-600 font-medium text-xs">{formatarMoeda(Number(t.encargo))}</td>
                    <td className="px-4 py-3 text-green-600 font-medium text-xs">{formatarMoeda(Number(t.spreadBruto))}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{Number(t.taxaCliente).toFixed(2)}%/m</td>
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
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

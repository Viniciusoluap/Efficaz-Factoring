import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { format } from 'date-fns';
import { TituloStatus } from '@prisma/client';
import { DollarSign, TrendingUp, Clock, BarChart3 } from 'lucide-react';

const statusCor: Record<TituloStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700', APROVADO: 'bg-green-100 text-green-700',
  VENCIDO: 'bg-red-100 text-red-700', LIQUIDADO: 'bg-blue-100 text-blue-700',
  PROTESTADO: 'bg-purple-100 text-purple-700', CANCELADO: 'bg-gray-100 text-gray-500',
};
const statusLabel: Record<TituloStatus, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Liquidado', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
};

export default async function PortalFornecedorPage() {
  const session = await getServerSession(authOptions);
  const fornecedorId = (session?.user as any)?.fornecedorId;
  if (!fornecedorId) redirect('/login');

  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id: fornecedorId },
    include: {
      titulos: {
        orderBy: { dataVencimento: 'asc' },
        include: { cliente: true },
      },
    },
  });

  if (!fornecedor) redirect('/login');

  const titulos = fornecedor.titulos;
  const capitalTotal = Number(fornecedor.capitalTotal);
  const alocado = titulos.filter(t => t.status === 'APROVADO').reduce((s, t) => s + Number(t.valor), 0);
  const rendimentoTotal = titulos.reduce((s, t) => s + Number(t.custoCedente), 0);
  const disponivel = capitalTotal - alocado;
  const pctAlocado = capitalTotal > 0 ? Math.min(100, (alocado / capitalTotal) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Boas-vindas */}
      <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl p-6 text-white">
        <p className="text-white/60 text-sm mb-1">Portal do Fornecedor de Capital</p>
        <h1 className="text-2xl font-bold">{fornecedor.nome}</h1>
        <p className="text-white/50 text-sm mt-1">{fornecedor.cpfCnpj}</p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Capital Total', value: formatarMoeda(capitalTotal), icon: DollarSign, cor: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Capital Alocado', value: formatarMoeda(alocado), icon: BarChart3, cor: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Disponível', value: formatarMoeda(disponivel), icon: Clock, cor: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rendimento Total', value: formatarMoeda(rendimentoTotal), icon: TrendingUp, cor: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, cor, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${cor}`} />
            </div>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Barra de alocação */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span className="font-medium">Capital Alocado</span>
          <span className="font-bold text-purple-600">{pctAlocado.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full">
          <div className="h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all" style={{ width: `${pctAlocado}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>0</span>
          <span>{formatarMoeda(capitalTotal)}</span>
        </div>
      </div>

      {/* Títulos alocados */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm">Títulos com meu Capital ({titulos.length})</h2>
        </div>
        {titulos.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">Nenhum título alocado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Número', 'Cliente', 'Vencimento', 'Valor', 'Meu Custo', 'Taxa', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {titulos.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{t.numero}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{t.cliente?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{format(new Date(t.dataVencimento), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{formatarMoeda(Number(t.valor))}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-purple-600">{formatarMoeda(Number(t.custoCedente))}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{Number(t.taxaFornecedor).toFixed(2)}%/m</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCor[t.status]}`}>
                        {statusLabel[t.status]}
                      </span>
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

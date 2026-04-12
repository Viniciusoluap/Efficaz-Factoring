import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { format } from 'date-fns';
import { TituloStatus, TituloTipo } from '@prisma/client';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const statusLabel: Record<TituloStatus, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Liquidado', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
};
const statusCor: Record<TituloStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700', APROVADO: 'bg-green-100 text-green-700',
  VENCIDO: 'bg-red-100 text-red-700', LIQUIDADO: 'bg-blue-100 text-blue-700',
  PROTESTADO: 'bg-purple-100 text-purple-700', CANCELADO: 'bg-gray-100 text-gray-500',
};
const tipoLabel: Record<TituloTipo, string> = {
  CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória',
};

export default async function PortalClientePage() {
  const session = await getServerSession(authOptions);
  const clienteId = (session?.user as any)?.clienteId;
  if (!clienteId) redirect('/login');

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      titulos: { orderBy: { dataVencimento: 'asc' } },
    },
  });

  if (!cliente) redirect('/login');

  const titulos = cliente.titulos;
  const totalCustodiado = titulos.filter(t => t.status === 'APROVADO').reduce((s, t) => s + Number(t.valor), 0);
  const totalLiquidado = titulos.filter(t => t.status === 'LIQUIDADO').reduce((s, t) => s + Number(t.valor), 0);
  const vencidos = titulos.filter(t => t.status === 'VENCIDO').length;
  const totalEncargos = titulos.reduce((s, t) => s + Number(t.encargo), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Boas-vindas */}
      <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-6 text-white">
        <p className="text-white/60 text-sm mb-1">Bem-vindo ao portal</p>
        <h1 className="text-2xl font-bold">{cliente.nome}</h1>
        <p className="text-white/50 text-sm mt-1">{cliente.cpfCnpj} · {cliente.email}</p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Em Custódia', value: formatarMoeda(totalCustodiado), icon: FileText, cor: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Liquidado', value: formatarMoeda(totalLiquidado), icon: CheckCircle, cor: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total de Encargos', value: formatarMoeda(totalEncargos), icon: Clock, cor: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Títulos Vencidos', value: String(vencidos), icon: AlertTriangle, cor: 'text-red-600', bg: 'bg-red-50' },
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

      {/* Extrato de títulos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm">Meus Títulos</h2>
        </div>
        {titulos.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Nenhum título vinculado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Tipo', 'Número', 'Emitente', 'Vencimento', 'Valor', 'Líquido', 'Taxa', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {titulos.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs">{tipoLabel[t.tipo]}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.numero}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{t.emitenteNome}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{format(new Date(t.dataVencimento), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{formatarMoeda(Number(t.valor))}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-green-600">{formatarMoeda(Number(t.valorLiquidoCliente))}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{Number(t.taxaCliente).toFixed(2)}%</td>
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

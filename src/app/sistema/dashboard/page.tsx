import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { TituloStatus } from '@prisma/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  DollarSign, FileText, AlertTriangle, Clock,
  TrendingUp, Percent, Users, Building2,
} from 'lucide-react';
import DashboardCharts from '@/components/sistema/DashboardCharts';

async function getDashboardData() {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  // Auto-mark overdue titles as VENCIDO
  try {
    await prisma.titulo.updateMany({
      where: {
        status: { in: [TituloStatus.PENDENTE, TituloStatus.APROVADO] },
        dataVencimento: { lt: new Date(hoje.toDateString()) },
      },
      data: { status: TituloStatus.VENCIDO },
    });
  } catch {}

  const [
    totalTitulos, custodiado, antecipado, vencimentosHoje,
    vencidos, spreadMes, impostoMes, totalClientes, totalFornecedores,
    titulosPorStatus, ultimosTitulos,
  ] = await Promise.all([
    prisma.titulo.count(),
    prisma.titulo.aggregate({
      _sum: { valor: true },
      where: { status: { in: [TituloStatus.APROVADO, TituloStatus.PENDENTE] } },
    }),
    prisma.titulo.aggregate({
      _sum: { valorLiquidoCliente: true },
      where: { operacao: { status: 'PAGA' } },
    }),
    prisma.titulo.count({
      where: {
        dataVencimento: {
          gte: new Date(hoje.toDateString()),
          lt: new Date(new Date(hoje.toDateString()).getTime() + 86400000),
        },
        status: { in: [TituloStatus.APROVADO, TituloStatus.PENDENTE] },
      },
    }),
    prisma.titulo.count({ where: { status: TituloStatus.VENCIDO } }),
    prisma.titulo.aggregate({
      _sum: { spreadBruto: true },
      where: { criadoEm: { gte: inicioMes, lte: fimMes } },
    }),
    prisma.titulo.aggregate({
      _sum: { impostoProvisao: true },
      where: { criadoEm: { gte: inicioMes, lte: fimMes } },
    }),
    prisma.cliente.count({ where: { ativo: true } }),
    prisma.fornecedor.count({ where: { ativo: true } }),
    prisma.titulo.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.titulo.findMany({
      take: 5,
      orderBy: { criadoEm: 'desc' },
      include: { cliente: true },
    }),
  ]);

  return {
    totalTitulos,
    custodiado: Number(custodiado._sum.valor ?? 0),
    antecipado: Number(antecipado._sum.valorLiquidoCliente ?? 0),
    vencimentosHoje,
    vencidos,
    spreadMes: Number(spreadMes._sum.spreadBruto ?? 0),
    impostoMes: Number(impostoMes._sum.impostoProvisao ?? 0),
    totalClientes,
    totalFornecedores,
    titulosPorStatus,
    ultimosTitulos,
  };
}

const statusLabel: Record<string, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Liquidado', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
};
const statusCor: Record<string, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700', APROVADO: 'bg-green-100 text-green-700',
  VENCIDO: 'bg-red-100 text-red-700', LIQUIDADO: 'bg-blue-100 text-blue-700',
  PROTESTADO: 'bg-purple-100 text-purple-700', CANCELADO: 'bg-gray-100 text-gray-600',
};

function valorFontClass(value: string) {
  const len = value.replace(/\s/g, '').length;
  if (len <= 4)  return 'text-2xl';
  if (len <= 7)  return 'text-xl';
  if (len <= 10) return 'text-lg';
  if (len <= 13) return 'text-base';
  return 'text-sm';
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  const cards = [
    { label: 'Total Custodiado', value: formatarMoeda(d.custodiado), icon: DollarSign, cor: 'text-blue-600', bg: 'bg-blue-50', desc: `${d.totalTitulos} títulos ativos` },
    { label: 'Total Antecipado', value: formatarMoeda(d.antecipado), icon: TrendingUp, cor: 'text-green-600', bg: 'bg-green-50', desc: 'Líquido de operações pagas' },
    { label: 'Spread do Mês', value: formatarMoeda(d.spreadMes), icon: Percent, cor: 'text-amber-600', bg: 'bg-amber-50', desc: `Imposto prov.: ${formatarMoeda(d.impostoMes)}` },
    { label: 'Vencem Hoje', value: String(d.vencimentosHoje), icon: Clock, cor: 'text-orange-600', bg: 'bg-orange-50', desc: 'Ação necessária' },
    { label: 'Títulos Vencidos', value: String(d.vencidos), icon: AlertTriangle, cor: 'text-red-600', bg: 'bg-red-50', desc: 'Requer atenção' },
    { label: 'Clientes Ativos', value: String(d.totalClientes), icon: Users, cor: 'text-indigo-600', bg: 'bg-indigo-50', desc: `${d.totalFornecedores} fornecedores` },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(({ label, value, icon: Icon, cor, bg, desc }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0 overflow-hidden">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${cor}`} />
            </div>
            <p className={`${valorFontClass(value)} font-bold text-gray-800 truncate`}>{value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5 truncate">{label}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">{desc}</p>
          </div>
        ))}
      </div>

      {/* Charts e tabela */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gráfico por status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-4">Títulos por Status</h3>
          <DashboardCharts data={d.titulosPorStatus.map(s => ({
            name: statusLabel[s.status] ?? s.status,
            value: s._count.status,
          }))} />
        </div>

        {/* Últimos títulos */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm">Últimos Títulos</h3>
            <a href="/sistema/relatorios" className="text-xs text-blue-600 hover:underline">Ver todos</a>
          </div>
          <div className="space-y-2">
            {d.ultimosTitulos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum título cadastrado ainda.</p>
            ) : (
              d.ultimosTitulos.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{t.numero}</p>
                      <p className="text-xs text-gray-400">{t.cliente?.nome ?? t.sacadoNome}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatarMoeda(Number(t.valor))}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCor[t.status]}`}>
                      {statusLabel[t.status]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

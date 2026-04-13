import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TituloStatus } from '@prisma/client';
import { BarChart3 } from 'lucide-react';

export default async function RelatoriosPage() {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const [totaisGeral, totaisMes, porTipo, topClientes] = await Promise.all([
    prisma.titulo.aggregate({
      _sum: { valor: true, encargo: true, spreadBruto: true, impostoProvisao: true, spreadLiquido: true },
      _count: { id: true },
    }),
    prisma.titulo.aggregate({
      _sum: { valor: true, encargo: true, spreadBruto: true, impostoProvisao: true, spreadLiquido: true },
      _count: { id: true },
      where: { criadoEm: { gte: inicioMes, lte: fimMes } },
    }),
    prisma.titulo.groupBy({
      by: ['tipo'],
      _sum: { valor: true },
      _count: { id: true },
    }),
    prisma.cliente.findMany({
      take: 10,
      include: {
        titulos: { select: { valor: true, spreadBruto: true } },
        _count: { select: { titulos: true } },
      },
    }),
  ]);

  const mesTitulo = format(hoje, "MMMM 'de' yyyy", { locale: ptBR });

  const topClientesOrdenados = topClientes
    .map(c => ({
      ...c,
      volume: c.titulos.reduce((s, t) => s + Number(t.valor), 0),
      spread: c.titulos.reduce((s, t) => s + Number(t.spreadBruto), 0),
    }))
    .sort((a, b) => b.volume - a.volume);

  return (
    <div className="space-y-6">
      {/* Resumo geral */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total de Títulos', value: String(totaisGeral._count.id), cor: 'text-gray-800' },
          { label: 'Volume Total', value: formatarMoeda(Number(totaisGeral._sum.valor ?? 0)), cor: 'text-blue-600' },
          { label: 'Encargos Totais', value: formatarMoeda(Number(totaisGeral._sum.encargo ?? 0)), cor: 'text-amber-600' },
          { label: 'Spread Bruto Total', value: formatarMoeda(Number(totaisGeral._sum.spreadBruto ?? 0)), cor: 'text-purple-600' },
          { label: 'Spread Líquido Total', value: formatarMoeda(Number(totaisGeral._sum.spreadLiquido ?? 0)), cor: 'text-green-600' },
        ].map(({ label, value, cor }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className={`text-xl font-bold ${cor}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mês atual */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 capitalize">{mesTitulo}</h3>
          <div className="space-y-3">
            {[
              { label: 'Títulos', value: String(totaisMes._count.id) },
              { label: 'Volume', value: formatarMoeda(Number(totaisMes._sum.valor ?? 0)) },
              { label: 'Spread Bruto', value: formatarMoeda(Number(totaisMes._sum.spreadBruto ?? 0)) },
              { label: 'Imposto Prov.', value: formatarMoeda(Number(totaisMes._sum.impostoProvisao ?? 0)) },
              { label: 'Spread Líquido', value: formatarMoeda(Number(totaisMes._sum.spreadLiquido ?? 0)) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-semibold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por tipo */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Volume por Tipo de Título</h3>
          <div className="space-y-3">
            {porTipo.map(t => {
              const tipoLabel: Record<string, string> = { CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória' };
              const total = Number(totaisGeral._sum.valor ?? 1);
              const v = Number(t._sum.valor ?? 0);
              const pct = total > 0 ? (v / total) * 100 : 0;
              return (
                <div key={t.tipo}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{tipoLabel[t.tipo]}</span>
                    <span>{formatarMoeda(v)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking de clientes */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Ranking de Clientes por Volume
        </h3>
        {topClientesOrdenados.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sem dados ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-gray-50">
                  {['#', 'Cliente', 'Títulos', 'Volume', 'Spread'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topClientesOrdenados.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-700 text-xs">{c.nome}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{c._count.titulos}</td>
                    <td className="px-4 py-2.5 text-blue-600 font-semibold text-xs">{formatarMoeda(c.volume)}</td>
                    <td className="px-4 py-2.5 text-green-600 font-semibold text-xs">{formatarMoeda(c.spread)}</td>
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

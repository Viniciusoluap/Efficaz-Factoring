'use client';

import { useEffect, useState } from 'react';
import { formatarMoeda } from '@/lib/calculos';
import { TrendingUp, FileText, DollarSign, Percent, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusOp: Record<string, { label: string; cor: string }> = {
  PAGA:    { label: 'Paga', cor: 'bg-green-100 text-green-700' },
  PENDENTE:{ label: 'Pendente', cor: 'bg-amber-100 text-amber-700' },
  ABERTA:  { label: 'Pendente', cor: 'bg-amber-100 text-amber-700' },
};

const statusTitulo: Record<string, { label: string; cor: string }> = {
  PENDENTE:  { label: 'Pendente', cor: 'bg-amber-100 text-amber-700' },
  LIQUIDADO: { label: 'Pago', cor: 'bg-green-100 text-green-700' },
  VENCIDO:   { label: 'Vencido', cor: 'bg-red-100 text-red-700' },
};

export default function PortalRelatorioPage() {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/relatorio')
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-400">Carregando...</div>;
  }

  if (!dados) {
    return <div className="text-center py-20 text-red-500">Erro ao carregar dados.</div>;
  }

  const { operacoes, totais } = dados;
  const totalVolume = Number(totais._sum?.valor ?? 0);
  const totalAntecipado = Number(totais._sum?.valorLiquidoCliente ?? 0);
  const totalEncargos = Number(totais._sum?.encargo ?? 0);
  const totalTitulos = totais._count?.id ?? 0;

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Títulos', value: String(totalTitulos), icon: FileText, cor: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Volume Total', value: formatarMoeda(totalVolume), icon: DollarSign, cor: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Antecipado', value: formatarMoeda(totalAntecipado), icon: TrendingUp, cor: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total em Encargos', value: formatarMoeda(totalEncargos), icon: Percent, cor: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, cor, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${cor}`} />
            </div>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Operações */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Minhas Operações
          <span className="ml-auto text-xs text-gray-400 font-normal">{operacoes.length} operação{operacoes.length !== 1 ? 'ões' : ''}</span>
        </h2>

        {operacoes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhuma operação registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {operacoes.map((op: any) => {
              const vol = op.titulos.reduce((s: number, t: any) => s + Number(t.valor), 0);
              const liq = op.titulos.reduce((s: number, t: any) => s + Number(t.valorLiquidoCliente), 0);
              const st = statusOp[op.status] ?? statusOp.ABERTA;
              return (
                <div key={op.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{op.numero}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(op.criadoEm), "dd/MM/yyyy", { locale: ptBR })} · {op._count.titulos} título{op._count.titulos !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cor}`}>{st.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Volume</p>
                      <p className="text-sm font-semibold text-blue-600">{formatarMoeda(vol)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Líquido Recebido</p>
                      <p className="text-sm font-semibold text-green-600">{formatarMoeda(liq)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Taxa</p>
                      <p className="text-sm font-semibold text-gray-700">{Number(op.taxaCliente).toFixed(2)}% a.m.</p>
                    </div>
                  </div>
                  {/* Mini-lista de títulos */}
                  <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                    {op.titulos.map((t: any) => {
                      const ts = statusTitulo[t.status] ?? statusTitulo.PENDENTE;
                      return (
                        <div key={t.id} className="flex items-center justify-between text-xs text-gray-600">
                          <span className="font-mono">{t.tipo} {t.numero}</span>
                          <span>{format(new Date(t.dataVencimento), 'dd/MM/yyyy')}</span>
                          <span className="font-semibold text-blue-600">{formatarMoeda(Number(t.valor))}</span>
                          <span className={`px-1.5 py-0.5 rounded-full font-medium ${ts.cor}`}>{ts.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
